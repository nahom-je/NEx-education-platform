const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

// Admin Auth Middleware helper
const adminOnly = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Admins only' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/categories/:id/courses
// @desc    Get courses for a specific category (optionally filter by semester)
// @access  Public
router.get('/:id/courses', async (req, res) => {
  try {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('category_id', req.params.id)
      .order('name', { ascending: true });

    if (req.query.semester) {
      query = query.eq('semester', req.query.semester);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching courses:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/categories
// @desc    Admin: Create a new category
// @access  Private/Admin
router.post('/', [authMiddleware, adminOnly], async (req, res) => {
  const { name, has_semesters, semesters, sort_order } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        has_semesters: !!has_semesters,
        semesters: semesters || [],
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating category:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST api/categories/:id/courses
// @desc    Admin: Add a course to a category
// @access  Private/Admin
router.post('/:id/courses', [authMiddleware, adminOnly], async (req, res) => {
  const { name, semester } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Course name is required' });
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        category_id: req.params.id,
        name: name.trim(),
        semester: semester || null
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating course:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;

