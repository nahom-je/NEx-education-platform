// backend/routes/adminPayments.js
// Admin-only routes for reviewing payment requests and managing course access.

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

// Admin guard middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
  next();
};

async function writeAuditLog(actorId, action, targetType, targetId, metadata) {
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
    created_at: new Date().toISOString()
  });
}

// GET /api/admin/payments
// List payment requests with optional filters
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, courseId, method, search, page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;

    let query = supabase
      .from('payment_requests')
      .select(`
        *,
        student:users!student_id(id, name, email, phone, avatar, university, department, year),
        reviewer:users!reviewed_by(id, name)
      `, { count: 'exact' })
      .order('claimed_at', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (method) query = query.eq('payment_method', method);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ requests: data || [], total: count || 0, page: parseInt(page), limit });
  } catch (err) {
    console.error('Admin payments list error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/payments/stats
// Summary stats for admin dashboard
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingRes, approvedTodayRes, allAccessRes] = await Promise.all([
      supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'claimed'),
      supabase.from('payment_requests').select('amount', { count: 'exact' }).eq('status', 'approved').gte('reviewed_at', today.toISOString()),
      supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ]);

    const price = parseInt(process.env.COURSE_PRICE || '70');
    const revenueToday = (approvedTodayRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    res.json({
      pendingCount: pendingRes.count || 0,
      approvedToday: approvedTodayRes.count || 0,
      revenueToday,
      totalApproved: allAccessRes.count || 0
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/payments/:id/approve
// Approve a payment request → create course_access rows for all courses
router.post('/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  const adminId = req.user.id;
  const { telegramConfirmed } = req.body;

  if (!telegramConfirmed) {
    return res.status(400).json({
      message: 'You must confirm that the screenshot was found on Telegram before approving.'
    });
  }

  try {
    const { data: pr, error: prErr } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (prErr || !pr) return res.status(404).json({ message: 'Request not found.' });
    if (pr.status !== 'claimed') {
      return res.status(400).json({ message: `Request is ${pr.status}, not claimed.` });
    }

    // Create course_access rows (upsert to handle edge cases)
    const accessRows = pr.course_ids.map(courseId => ({
      student_id: pr.student_id,
      course_id: courseId,
      status: 'unlocked',
      payment_request_id: pr.id,
      granted_by: adminId,
      granted_at: new Date().toISOString()
    }));

    const { error: acErr } = await supabase
      .from('course_access')
      .upsert(accessRows, { onConflict: 'student_id,course_id' });
    if (acErr) throw acErr;

    // Update payment request
    const { error: uErr } = await supabase
      .from('payment_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        telegram_confirmed: true
      })
      .eq('id', req.params.id);
    if (uErr) throw uErr;

    // Audit log
    await writeAuditLog(adminId, 'payment_approved', 'payment_request', pr.id, {
      student_id: pr.student_id,
      course_ids: pr.course_ids,
      amount: pr.amount,
      payment_code: pr.payment_code
    });

    // Emit to student
    const io = req.app.get('io');
    if (io) {
      io.to(`student-${pr.student_id}`).emit('payment:approved', {
        requestId: pr.id,
        courseIds: pr.course_ids
      });
    }

    res.json({ message: 'Payment approved. Course access granted.' });
  } catch (err) {
    console.error('Approve error:', err.message);
    res.status(500).json({ message: 'Server error approving payment.' });
  }
});

// POST /api/admin/payments/:id/reject
// Reject a payment request with a reason
router.post('/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  const adminId = req.user.id;
  const { rejectReasonCode, rejectReason } = req.body;

  if (!rejectReasonCode || !rejectReason) {
    return res.status(400).json({ message: 'Reject reason is required.' });
  }

  try {
    const { data: pr, error: prErr } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (prErr || !pr) return res.status(404).json({ message: 'Request not found.' });
    if (pr.status !== 'claimed') {
      return res.status(400).json({ message: `Request is ${pr.status}, not claimed.` });
    }

    const { error: uErr } = await supabase
      .from('payment_requests')
      .update({
        status: 'rejected',
        reject_reason_code: rejectReasonCode,
        reject_reason: rejectReason,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', req.params.id);
    if (uErr) throw uErr;

    // Increment student rejection counter
    await supabase.rpc('increment_rejection_count', { p_student_id: pr.student_id })
      .catch(() => {}); // soft fail if RPC not set up

    // Audit log
    await writeAuditLog(adminId, 'payment_rejected', 'payment_request', pr.id, {
      student_id: pr.student_id,
      reason: rejectReason
    });

    // Emit to student
    const io = req.app.get('io');
    if (io) {
      io.to(`student-${pr.student_id}`).emit('payment:rejected', {
        requestId: pr.id,
        reason: rejectReason
      });
    }

    res.json({ message: 'Payment rejected.' });
  } catch (err) {
    console.error('Reject error:', err.message);
    res.status(500).json({ message: 'Server error rejecting payment.' });
  }
});

// POST /api/admin/access/grant
// Manually grant course access to a student (supports single course or whole package of courses)
router.post('/access/grant', authMiddleware, adminOnly, async (req, res) => {
  const adminId = req.user.id;
  const { studentId, courseId, courseIds, packageName, reason } = req.body;

  const targetCourseIds = Array.isArray(courseIds) && courseIds.length > 0
    ? courseIds
    : courseId ? [courseId] : [];

  if (!studentId || targetCourseIds.length === 0) {
    return res.status(400).json({ message: 'studentId and at least one courseId are required.' });
  }

  try {
    const rows = targetCourseIds.map(cId => ({
      student_id: studentId,
      course_id: cId,
      status: 'unlocked',
      granted_by: adminId,
      granted_at: new Date().toISOString(),
      revoked_at: null,
      revoke_reason: null
    }));

    const { error } = await supabase
      .from('course_access')
      .upsert(rows, { onConflict: 'student_id,course_id' });

    if (error) throw error;

    await writeAuditLog(adminId, 'access_granted_manual', 'course_access', null, {
      student_id: studentId,
      course_ids: targetCourseIds,
      package_name: packageName,
      reason: reason || 'Admin manual access grant'
    });

    // Notify student via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`student-${studentId}`).emit('payment:approved', {
        courseIds: targetCourseIds,
        message: 'Admin has unlocked your course package.'
      });
    }

    res.json({ message: `Access granted for ${targetCourseIds.length} course(s).` });
  } catch (err) {
    console.error('Grant access error:', err.message);
    res.status(500).json({ message: 'Server error granting access.' });
  }
});

// POST /api/admin/access/revoke
// Revoke (lock) a student's course access
router.post('/access/revoke', authMiddleware, adminOnly, async (req, res) => {
  const adminId = req.user.id;
  const { studentId, courseId, reason } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ message: 'studentId and courseId are required.' });
  }

  try {
    const { error } = await supabase
      .from('course_access')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoke_reason: reason || 'Admin revoked access.'
      })
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) throw error;

    await writeAuditLog(adminId, 'access_revoked', 'course_access', null, {
      student_id: studentId,
      course_id: courseId,
      reason
    });

    // Emit to student
    const io = req.app.get('io');
    if (io) io.to(`student-${studentId}`).emit('access:revoked', { courseId });

    res.json({ message: 'Access revoked.' });
  } catch (err) {
    console.error('Revoke error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/students
// List students with their unlocked courses
router.get('/students', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, university, department, year, is_blocked, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each student, get their access
    const studentIds = (data || []).map(u => u.id);
    const { data: accesses } = await supabase
      .from('course_access')
      .select('student_id, course_id, status, course:courses(id, name)')
      .in('student_id', studentIds);

    const accessMap = {};
    (accesses || []).forEach(a => {
      if (!accessMap[a.student_id]) accessMap[a.student_id] = [];
      accessMap[a.student_id].push(a);
    });

    const students = (data || []).map(u => ({
      ...u,
      accesses: accessMap[u.id] || []
    }));

    res.json(students);
  } catch (err) {
    console.error('Admin students error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/students/:id/block
// Block or unblock a student
router.post('/students/:id/block', authMiddleware, adminOnly, async (req, res) => {
  const adminId = req.user.id;
  const { block, reason } = req.body;

  try {
    const { error } = await supabase
      .from('users')
      .update({ is_blocked: !!block })
      .eq('id', req.params.id);

    if (error) throw error;

    await writeAuditLog(adminId, block ? 'student_blocked' : 'student_unblocked', 'user', req.params.id, { reason });

    res.json({ message: block ? 'Student blocked.' : 'Student unblocked.' });
  } catch (err) {
    console.error('Block error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/users/:id/reset-password
// Sets a temporary password and forces student to change it at next login
router.post('/users/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  const adminId = req.user.id;
  const { tempPassword } = req.body;

  if (!tempPassword || tempPassword.length < 8) {
    return res.status(400).json({ message: 'Temporary password must be at least 8 characters.' });
  }

  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const { error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        must_change_password: true
      })
      .eq('id', req.params.id);

    if (error) throw error;

    await writeAuditLog(adminId, 'admin_reset_password', 'user', req.params.id, {
      note: 'Temporary password set by admin'
    });

    res.json({ message: 'Temporary password set successfully.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error resetting password.' });
  }
});

// GET /api/admin/audit-log
router.get('/audit-log', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*, actor:users!actor_id(id, name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Audit log error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;

