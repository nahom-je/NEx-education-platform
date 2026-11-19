const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

// Helper to make string slug
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * 1. GET /api/browse/categories
 * Returns all categories with count of approved resources
 */
router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, has_semesters, semesters, sort_order')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Fetch count of approved resources per category
    const { data: resources, error: resErr } = await supabase
      .from('resources')
      .select('category_id')
      .eq('status', 'approved');

    const counts = {};
    (resources || []).forEach(r => {
      if (r.category_id) {
        counts[r.category_id] = (counts[r.category_id] || 0) + 1;
      }
    });

    const result = (categories || []).map(cat => ({
      ...cat,
      slug: slugify(cat.name),
      resource_count: counts[cat.id] || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * 2. GET /api/browse/:categorySlug
 * Returns single category by slug
 */
router.get('/:categorySlug', async (req, res, next) => {
  const { categorySlug } = req.params;
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, has_semesters, semesters, sort_order');

    if (error) throw error;

    const cat = (categories || []).find(
      c => slugify(c.name) === categorySlug.toLowerCase()
    );

    if (!cat) return res.status(404).json({ error: 'Category not found' });

    res.json({
      ...cat,
      slug: slugify(cat.name),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2b. GET /api/browse/:categorySlug/courses
 * Direct course listing for categories without semesters
 */
router.get('/:categorySlug/courses', async (req, res, next) => {
  const { categorySlug } = req.params;
  try {
    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('id, name');

    if (catErr) throw catErr;

    const cat = (categories || []).find(
      c => slugify(c.name) === categorySlug.toLowerCase()
    );

    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const { data: courses, error: courseErr } = await supabase
      .from('courses')
      .select('id, name, semester')
      .eq('category_id', cat.id)
      .order('name', { ascending: true });

    if (courseErr) throw courseErr;

    const { data: resources } = await supabase
      .from('resources')
      .select('course_id')
      .eq('category_id', cat.id)
      .eq('status', 'approved');

    const counts = {};
    (resources || []).forEach(r => {
      if (r.course_id) {
        counts[r.course_id] = (counts[r.course_id] || 0) + 1;
      }
    });

    const result = (courses || []).map(c => ({
      ...c,
      slug: slugify(c.name),
      resource_count: counts[c.id] || 0
    }));

    res.json({
      category: { ...cat, slug: slugify(cat.name) },
      courses: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. GET /api/browse/:categorySlug/:semesterSlug/courses
 * Returns courses in a specific semester of a category, with material counts
 */
router.get('/:categorySlug/:semesterSlug/courses', async (req, res, next) => {
  const { categorySlug, semesterSlug } = req.params;
  try {
    // 1. Find category
    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('id, name');

    if (catErr) throw catErr;

    const cat = (categories || []).find(
      c => slugify(c.name) === categorySlug.toLowerCase()
    );

    if (!cat) return res.status(404).json({ error: 'Category not found' });

    // Format semester: e.g. "semester-1" -> "Semester 1"
    const semesterName = semesterSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // 2. Fetch courses
    const { data: courses, error: courseErr } = await supabase
      .from('courses')
      .select('id, name, semester')
      .eq('category_id', cat.id)
      .ilike('semester', semesterName)
      .order('name', { ascending: true });

    if (courseErr) throw courseErr;

    // 3. Get resource counts per course
    const { data: resources } = await supabase
      .from('resources')
      .select('course_id')
      .eq('category_id', cat.id)
      .eq('status', 'approved');

    const counts = {};
    (resources || []).forEach(r => {
      if (r.course_id) {
        counts[r.course_id] = (counts[r.course_id] || 0) + 1;
      }
    });

    const result = (courses || []).map(c => ({
      ...c,
      slug: slugify(c.name),
      resource_count: counts[c.id] || 0
    }));

    res.json({
      category: { ...cat, slug: slugify(cat.name) },
      semester: semesterName,
      semester_slug: semesterSlug,
      courses: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. GET /api/browse/:categorySlug/:semesterSlug/:courseSlug/materials
 * Returns course materials grouped by type, with count badges and search filtering
 */
router.get('/:categorySlug/:semesterSlug/:courseSlug/materials', async (req, res, next) => {
  const { categorySlug, semesterSlug, courseSlug } = req.params;
  const { type, search, page = 1, limit = 50 } = req.query;

  try {
    // 1. Find category
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');

    const cat = (categories || []).find(
      c => slugify(c.name) === categorySlug.toLowerCase()
    );

    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const semesterName = semesterSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // 2. Find course
    const { data: courses } = await supabase
      .from('courses')
      .select('id, name, semester')
      .eq('category_id', cat.id);

    const course = (courses || []).find(
      c => slugify(c.name) === courseSlug.toLowerCase() &&
           (!c.semester || c.semester.toLowerCase() === semesterName.toLowerCase())
    );

    if (!course) return res.status(404).json({ error: 'Course not found' });

    // 2.5 Course Access Check (Admin = Master Access, Student = Must be Unlocked by Admin)
    let isUnlocked = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = decoded.user || decoded;
        if (currentUser.role === 'admin') {
          isUnlocked = true;
        } else if (currentUser.id) {
          const { data: access } = await supabase
            .from('course_access')
            .select('id, status')
            .eq('student_id', currentUser.id)
            .eq('course_id', course.id)
            .eq('status', 'unlocked')
            .maybeSingle();

          if (access) isUnlocked = true;
        }
      } catch (err) {
        console.error('browse access token check error:', err.message);
      }
    }

    // 3. Fetch all approved resources for this course
    const { data: rawMaterials, error } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        description,
        type,
        file_url,
        file_size,
        downloads,
        status,
        created_at,
        uploader:users!uploader_id (id, name, role)
      `)
      .eq('course_id', course.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // If locked, hide materials and file URLs from unauthorized users
    if (!isUnlocked) {
      return res.json({
        category: { ...cat, slug: slugify(cat.name) },
        course: { ...course, slug: slugify(course.name) },
        semester: semesterName,
        semester_slug: semesterSlug,
        locked: true,
        typeCounts: { all: (rawMaterials || []).length },
        materialsCount: (rawMaterials || []).length,
        materials: []
      });
    }

    // Helper to determine normalized type
    const getNormalizedType = (r) => {
      const t = (r.type || '').toLowerCase();
      if (t === 'mid_exam' || t === 'final_exam' || t === 'exam') {
        return 'exam';
      }
      if (t === 'assignment' || t === 'worksheet' || t === 'questions') {
        return 'worksheet';
      }
      if (t === 'notes' || t === 'slides' || t === 'module') {
        return 'notes';
      }
      if (t === 'teachers_guide' || t === 'guide' || t === 'other') {
        return 'teachers_guide';
      }
      if (t === 'project') return 'project';
      return 'notes';
    };

    // Calculate exact breakdown counts
    const typeCounts = {
      all: (rawMaterials || []).length,
      exam: 0,
      worksheet: 0,
      notes: 0,
      teachers_guide: 0,
      project: 0
    };

    (rawMaterials || []).forEach(r => {
      const norm = getNormalizedType(r);
      if (typeCounts[norm] !== undefined) {
        typeCounts[norm]++;
      } else {
        typeCounts.notes++;
      }
    });

    // Filter by type and search query
    let filtered = (rawMaterials || []).filter(r => {
      const norm = getNormalizedType(r);
      if (type && type !== 'all') {
        if ((type === 'worksheet' || type === 'assignment') && norm === 'worksheet') {
          // match
        } else if (norm !== type) {
          return false;
        }
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesTitle = (r.title || '').toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const total = filtered.length;
    const from = (pageNum - 1) * limitNum;
    const paged = filtered.slice(from, from + limitNum);

    const formattedMaterials = paged.map(m => ({
      ...m,
      _id: m.id,
      type: getNormalizedType(m)
    }));

    res.json({
      category: { ...cat, slug: slugify(cat.name) },
      semester: semesterName,
      semester_slug: semesterSlug,
      course: { ...course, slug: slugify(course.name) },
      counts: typeCounts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      materials: formattedMaterials
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
