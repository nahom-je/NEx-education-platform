const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Admin Auth Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Admins only' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/admin/resources/pending
// @desc    Get all pending resources
// @access  Private/Admin
router.get('/resources/pending', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const pendingResources = await Resource.find({ status: 'pending' })
      .populate('uploader', 'name university email avatar')
      .sort({ createdAt: 1 });
    res.json(pendingResources);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/resources/:id/approve
// @desc    Approve a resource
// @access  Private/Admin
router.put('/resources/:id/approve', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/resources/:id/reject
// @desc    Reject a resource
// @access  Private/Admin
router.put('/resources/:id/reject', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users for management
// @access  Private/Admin
router.get('/users', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
