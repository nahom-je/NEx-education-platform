const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET api/resources
// @desc    Get all resources (approved)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filters = { status: 'approved' };
    
    // Optional filters from query params
    if (req.query.type) filters.type = req.query.type;
    if (req.query.university) filters.university = req.query.university;
    if (req.query.year) filters.academicYear = req.query.year;
    
    // Search by course code/name
    if (req.query.search) {
      filters.$or = [
        { courseCode: { $regex: req.query.search, $options: 'i' } },
        { courseName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const resources = await Resource.find(filters)
      .populate('uploader', 'name university avatar')
      .sort({ createdAt: -1 });
      
    res.json(resources);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/resources/:id
// @desc    Get resource details by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploader', 'name university role avatar bio')
      .populate('comments.user', 'name avatar');

    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    
    res.json(resource);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Resource not found' });
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/resources
// @desc    Upload a new resource with a file
// @access  Private
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log("--- MULTIPART UPLOAD INCOMING ---");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Build the resource object from the form fields
    const resourceData = {
      title: req.body.title,
      type: req.body.type,
      university: req.body.university,
      courseCode: req.body.courseCode,
      courseName: req.body.courseName,
      academicYear: req.body.year || req.body.academicYear, // handle both formats for safety
      description: req.body.description,
      // Parse tags from comma separated string
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
      // Create local URL for the file (replace backslashes with forward slashes for URLs)
      fileUrl: `http://localhost:5000/uploads/${req.file.filename.replace(/\\/g, '/')}`,
      fileSize: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
      uploader: req.user.id,
      status: 'pending' // Admin must approve
    };

    const newResource = new Resource(resourceData);
    const resource = await newResource.save();
    res.json(resource);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/resources/:id/rate
// @desc    Rate a resource
// @access  Private
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Check if user already rated, if so update score
    const existingRatingParams = resource.ratings.findIndex(r => r.user.toString() === req.user.id);
    if (existingRatingParams !== -1) {
      resource.ratings[existingRatingParams].score = req.body.score;
    } else {
      resource.ratings.push({ user: req.user.id, score: req.body.score });
    }

    await resource.save();
    res.json(resource.ratings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/resources/:id/comment
// @desc    Comment on a resource
// @access  Private
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    resource.comments.push({
      user: req.user.id,
      text: req.body.text
    });

    await resource.save();
    
    // Return the newly populated comments
    const populatedResource = await Resource.findById(req.params.id).populate('comments.user', 'name avatar');
    res.json(populatedResource.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
