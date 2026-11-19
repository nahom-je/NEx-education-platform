const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper to format resource for React frontend
const formatResource = (r) => ({
  ...r,
  _id: r.id,
  fileUrl: r.file_url,
  fileSize: r.file_size,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  categoryName: r.category?.name || '',
  courseName: r.course?.name || r.course_name || ''
});

// @route   GET api/resources
// @desc    Get all approved resources with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('resources')
      .select(`
        *,
        uploader:users(id, name, avatar, university),
        category:categories(id, name),
        course:courses(id, name)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    // Optional filters
    if (req.query.type) {
      query = query.eq('type', req.query.type.toLowerCase());
    }
    if (req.query.category_id || req.query.category) {
      query = query.eq('category_id', req.query.category_id || req.query.category);
    }
    if (req.query.semester) {
      query = query.eq('semester', req.query.semester);
    }
    if (req.query.course_id || req.query.course) {
      query = query.eq('course_id', req.query.course_id || req.query.course);
    }
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }

    const { data: resources, error } = await query;
    if (error) throw error;

    res.json((resources || []).map(formatResource));
  } catch (err) {
    console.error('Error fetching resources:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/resources/:id
// @desc    Get resource details by ID (with uploader and comments)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { data: resource, error } = await supabase
      .from('resources')
      .select(`
        *,
        uploader:users(id, name, avatar, university, role, bio),
        category:categories(id, name),
        course:courses(id, name)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Fetch comments
    const { data: comments, error: commentsErr } = await supabase
      .from('resource_comments')
      .select(`
        id,
        text,
        created_at,
        user:users(id, name, avatar)
      `)
      .eq('resource_id', req.params.id)
      .order('created_at', { ascending: true });

    if (commentsErr) console.error('Error fetching comments:', commentsErr.message);

    // Check course access for non-admins
    let isUnlocked = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = decoded.user || decoded;
        if (currentUser.role === 'admin') {
          isUnlocked = true;
        } else if (currentUser.id && resource.course_id) {
          const { data: access } = await supabase
            .from('course_access')
            .select('id, status')
            .eq('student_id', currentUser.id)
            .eq('course_id', resource.course_id)
            .eq('status', 'unlocked')
            .maybeSingle();

          if (access) isUnlocked = true;
        }
      } catch (err) {
        console.error('resource access check error:', err.message);
      }
    }

    const formatted = formatResource(resource);
    if (!isUnlocked) {
      formatted.locked = true;
      formatted.file_url = null;
      formatted.fileUrl = null;
    }

    formatted.comments = (comments || []).map(c => ({
      ...c,
      _id: c.id,
      createdAt: c.created_at,
      user: {
        ...c.user,
        _id: c.user?.id
      }
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching resource details:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/resources
// @desc    Upload a new resource with a file
// @access  Private
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const title = req.body.title;
    const type = (req.body.type || 'notes').toLowerCase();
    const category_id = req.body.category_id || req.body.category || null;
    const semester = req.body.semester || null;
    const course_id = req.body.course_id || req.body.course || null;
    const description = req.body.description || '';
    
    // Parse tags
    let tags = [];
    if (req.body.tags) {
      tags = typeof req.body.tags === 'string'
        ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean)
        : req.body.tags;
    }

    const fileUrl = `http://localhost:5000/uploads/${req.file.filename.replace(/\\/g, '/')}`;
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        title,
        type,
        university: 'Jimma University',
        category_id: category_id || null,
        semester,
        course_id: course_id || null,
        description,
        tags,
        file_url: fileUrl,
        file_size: fileSize,
        uploader_id: req.user.id,
        status: 'pending',
        downloads: 0
      })
      .select(`
        *,
        uploader:users(id, name, avatar, university),
        category:categories(id, name),
        course:courses(id, name)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(formatResource(resource));
  } catch (err) {
    console.error('Upload resource error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   GET api/resources/:id/download (Disabled in NEx - view only)
router.get("/:id/download", (req, res) => {
  res.status(403).json({ message: "Downloads are disabled. View directly inside the NEx platform." });
});

// @route   POST api/resources/:id/comment
// @desc    Comment on a resource
// @access  Private
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  try {
    const { error: insertErr } = await supabase
      .from('resource_comments')
      .insert({
        resource_id: req.params.id,
        user_id: req.user.id,
        text: text.trim()
      });

    if (insertErr) throw insertErr;

    // Return the newly populated comments list
    const { data: comments, error: fetchErr } = await supabase
      .from('resource_comments')
      .select(`
        id,
        text,
        created_at,
        user:users(id, name, avatar)
      `)
      .eq('resource_id', req.params.id)
      .order('created_at', { ascending: true });

    if (fetchErr) throw fetchErr;

    const formatted = (comments || []).map(c => ({
      ...c,
      _id: c.id,
      createdAt: c.created_at,
      user: {
        ...c.user,
        _id: c.user?.id
      }
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Comment error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;