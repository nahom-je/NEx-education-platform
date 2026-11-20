const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const deviceService = require('../services/deviceService');

// Admin Auth Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }
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

// @route   GET api/admin/stats
// @desc    Get real platform statistics from Supabase
// @access  Private/Admin
router.get('/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const [
      { count: totalResources },
      { count: pendingReview },
      { count: totalUsers },
      { count: activeAccesses },
      { count: pendingPayments }
    ] = await Promise.all([
      supabase.from('resources').select('*', { count: 'exact', head: true }),
      supabase.from('resources').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('course_access').select('*', { count: 'exact', head: true }),
      supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'submitted')
    ]);

    res.json({
      totalResources: totalResources || 0,
      pendingReview: pendingReview || 0,
      totalUsers: totalUsers || 0,
      activeAccesses: activeAccesses || 0,
      pendingPayments: pendingPayments || 0
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/admin/resources/pending
// @desc    Get all pending resources
// @access  Private/Admin
router.get('/resources/pending', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { data: pendingResources, error } = await supabase
      .from('resources')
      .select(`
        *,
        uploader:users(id, name, university, email, phone, avatar),
        category:categories(id, name),
        course:courses(id, name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formatted = (pendingResources || []).map(r => ({
      ...r,
      _id: r.id,
      fileUrl: r.file_url,
      fileSize: r.file_size,
      categoryName: r.category?.name || '',
      courseName: r.course?.name || ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching pending resources:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/admin/resources/:id/approve
// @desc    Approve a resource
// @access  Private/Admin
router.put('/resources/:id/approve', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { data: resource, error } = await supabase
      .from('resources')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ ...resource, _id: resource.id });
  } catch (err) {
    console.error('Error approving resource:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/admin/resources/:id/reject
// @desc    Reject a resource
// @access  Private/Admin
router.put('/resources/:id/reject', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { data: resource, error } = await supabase
      .from('resources')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ ...resource, _id: resource.id });
  } catch (err) {
    console.error('Error rejecting resource:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/admin/users
// @desc    Get all real users with their upload counts and access counts
// @access  Private/Admin
router.get('/users', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const [
      { data: users, error: userError },
      { data: resources, error: resError },
      { data: accesses, error: accError },
      devicesMap
    ] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email, phone, university, department, year, role, is_blocked, status, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('resources').select('uploader_id'),
      supabase.from('course_access').select('user_id'),
      deviceService.getAllUserDevices()
    ]);

    if (userError) throw userError;

    // Calculate upload counts
    const uploadCounts = {};
    (resources || []).forEach(r => {
      if (r.uploader_id) {
        uploadCounts[r.uploader_id] = (uploadCounts[r.uploader_id] || 0) + 1;
      }
    });

    // Calculate access counts
    const accessCounts = {};
    (accesses || []).forEach(a => {
      if (a.user_id) {
        accessCounts[a.user_id] = (accessCounts[a.user_id] || 0) + 1;
      }
    });

    const formatted = (users || []).map(u => ({
      ...u,
      _id: u.id,
      uploadsCount: uploadCounts[u.id] || 0,
      accessesCount: accessCounts[u.id] || 0,
      contact: u.phone || u.email || 'No contact',
      device: devicesMap[u.id] || null
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching admin users:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/admin/users/:id/toggle-block
// @desc    Toggle block/unblock status for a user
// @access  Private/Admin
router.put('/users/:id/toggle-block', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Admin cannot ban themselves
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot block your own admin account' });
    }

    const { data: targetUser, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, is_blocked, role')
      .eq('id', targetUserId)
      .maybeSingle();

    if (fetchErr || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nextBlockedState = !targetUser.is_blocked;

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({
        is_blocked: nextBlockedState,
        status: nextBlockedState ? 'blocked' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select('id, name, is_blocked, status')
      .single();

    if (updateErr) throw updateErr;

    res.json({
      message: nextBlockedState ? `${targetUser.name} has been blocked.` : `${targetUser.name} has been unblocked.`,
      user: updated
    });
  } catch (err) {
    console.error('Error toggling block state:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/admin/users/:id/reset-password
// @desc    Admin reset user password
// @access  Private/Admin
router.post('/users/:id/reset-password', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { newPassword } = req.body;

    const temporaryPassword = newPassword && newPassword.trim().length >= 6
      ? newPassword.trim()
      : 'NEx' + Math.floor(100000 + Math.random() * 900000) + '!';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    const { error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        must_change_password: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId);

    if (error) throw error;

    res.json({
      message: 'Password reset successfully',
      temporaryPassword
    });
  } catch (err) {
    console.error('Error resetting user password:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/admin/users/:id/reset-device
// @desc    Admin unbind / reset student registered device lock
// @access  Private/Admin
router.post('/users/:id/reset-device', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const ok = await deviceService.resetUserDevice(targetUserId);

    if (!ok) {
      return res.status(500).json({ message: 'Failed to reset device binding' });
    }

    res.json({
      message: 'Device lock reset successfully. The student can now sign in on their new device.'
    });
  } catch (err) {
    console.error('Error resetting user device:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/admin/users/:id/details
// @desc    Get user's full access list and details
// @access  Private/Admin
router.get('/users/:id/details', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const targetUserId = req.params.id;

    const [
      { data: user, error: uErr },
      { data: accesses, error: aErr }
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', targetUserId).maybeSingle(),
      supabase
        .from('course_access')
        .select(`
          *,
          course:courses(id, name, code)
        `)
        .eq('user_id', targetUserId)
    ]);

    if (uErr || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        university: user.university,
        department: user.department,
        year: user.year,
        role: user.role,
        is_blocked: user.is_blocked,
        status: user.status,
        created_at: user.created_at
      },
      unlockedCourses: accesses || []
    });
  } catch (err) {
    console.error('Error fetching user details:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
