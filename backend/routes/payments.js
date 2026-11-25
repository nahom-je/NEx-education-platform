// backend/routes/payments.js
// Student-facing payment flow: create draft, claim, cancel, remind, get status.

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

// ── Helpers ──────────────────────────────────────────────────────────────────

function generatePaymentCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous O/0/1/I
  let code = 'NEX-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniquePaymentCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generatePaymentCode();
    const { data } = await supabase
      .from('payment_requests')
      .select('id')
      .eq('payment_code', code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error('Could not generate unique payment code.');
}

function emitToAdminRoom(io, event, payload) {
  if (io) io.to('admin-room').emit(event, payload);
}

function emitToStudent(io, studentId, event, payload) {
  if (io) io.to(`student-${studentId}`).emit(event, payload);
}

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/payments/create
// Create a draft payment request (or return existing draft for same courses)
router.post('/create', authMiddleware, async (req, res) => {
  const studentId = req.user.id;
  const { courseIds, packageCount, packageNames, fullName, phone } = req.body;

  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return res.status(400).json({ message: 'At least one course is required.' });
  }
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    // Check student not blocked
    const { data: student } = await supabase
      .from('users')
      .select('is_blocked, rejection_count_24h, last_rejection_at, name, email')
      .eq('id', studentId)
      .maybeSingle();

    if (student?.is_blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
    }

    // Check 3 rejections in 24h
    if (student?.rejection_count_24h >= 3 && student?.last_rejection_at) {
      const hoursSince = (Date.now() - new Date(student.last_rejection_at).getTime()) / 3600000;
      if (hoursSince < 24) {
        return res.status(429).json({
          message: 'You have had 3 rejected requests in the last 24 hours. Please wait or contact admin.'
        });
      }
    }

    // Verify courses exist
    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select('id, name')
      .in('id', courseIds);
    if (cErr) throw cErr;
    if (!courses || courses.length !== courseIds.length) {
      return res.status(400).json({ message: 'One or more courses not found.' });
    }

    // Check which courses already have unlocked access
    const { data: existingAccess } = await supabase
      .from('course_access')
      .select('course_id')
      .eq('student_id', studentId)
      .eq('status', 'unlocked')
      .in('course_id', courseIds);
    const alreadyUnlocked = (existingAccess || []).map(a => a.course_id);
    const payableCourses = courseIds.filter(id => !alreadyUnlocked.includes(id));

    if (payableCourses.length === 0) {
      return res.status(400).json({ message: 'You already have access to all selected courses.' });
    }

    // Get price from settings (150 ETB per semester / department package)
    const { data: priceSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'course_price')
      .maybeSingle();
    const price = parseInt(priceSetting?.value || process.env.COURSE_PRICE || '150');
    
    // 150 ETB per entire PACKAGE (e.g. "Freshman First Semester")
    const numPackages = Math.max(1, parseInt(packageCount) || (Array.isArray(packageNames) && packageNames.length ? packageNames.length : 1));
    const amount = price * numPackages;

    const paymentCode = await uniquePaymentCode();

    const { data: request, error: insertErr } = await supabase
      .from('payment_requests')
      .insert({
        student_id: studentId,
        course_ids: payableCourses,
        amount,
        status: 'draft',
        payment_code: paymentCode,
        student_name: fullName.trim(),
        student_phone: phone.trim()
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.json({
      request,
      courses: courses.filter(c => payableCourses.includes(c.id)),
      amount,
      packageNames: Array.isArray(packageNames) ? packageNames : [],
      paymentCode
    });
  } catch (err) {
    console.error('Create payment error:', err.message);
    res.status(500).json({ message: 'Server error creating payment request.' });
  }
});

// POST /api/payments/:id/claim
// Student confirms they sent the screenshot. Draft → Claimed.
router.post('/:id/claim', authMiddleware, async (req, res) => {
  const studentId = req.user.id;
  const { transactionId = '', paymentMethod = 'cbe' } = req.body;

  if (paymentMethod && !['cbe', 'telebirr'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Payment method must be "cbe" or "telebirr".' });
  }

  try {
    // Load the draft
    const { data: req_, error: rErr } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (rErr || !req_) return res.status(404).json({ message: 'Payment request not found.' });
    if (req_.status !== 'draft') {
      return res.status(400).json({ message: `Request is already ${req_.status}.` });
    }

    // Check no active claimed request for same student + any overlapping course
    const { data: existing } = await supabase
      .from('payment_requests')
      .select('id, course_ids, payment_code')
      .eq('student_id', studentId)
      .eq('status', 'claimed');

    if (existing && existing.length > 0) {
      const overlap = existing.some(e =>
        e.course_ids.some(cId => req_.course_ids.includes(cId))
      );
      if (overlap) {
        return res.status(400).json({
          message: 'You already have a pending payment request for one of these courses. Please wait for it to be reviewed.'
        });
      }
    }

    // If transaction ID was optionally provided, check uniqueness
    if (transactionId && transactionId.trim()) {
      const { data: txDup } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('transaction_id', transactionId.trim())
        .maybeSingle();
      if (txDup && txDup.id !== req_.id) {
        return res.status(400).json({
          message: 'This Transaction ID has already been used.'
        });
      }
    }

    // Update to claimed
    const { data: updated, error: uErr } = await supabase
      .from('payment_requests')
      .update({
        status: 'claimed',
        payment_method: paymentMethod,
        transaction_id: transactionId ? transactionId.trim() : null,
        claimed_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (uErr) throw uErr;

    // Emit to admin room via Socket.io
    const io = req.app.get('io');
    emitToAdminRoom(io, 'payment:claimed', { requestId: updated.id });

    res.json({ message: 'Payment request submitted. Please wait for admin approval.', request: updated });
  } catch (err) {
    console.error('Claim payment error:', err.message);
    res.status(500).json({ message: 'Server error claiming payment.' });
  }
});

// POST /api/payments/:id/cancel
// Student cancels before admin reviews (Claimed only).
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  const studentId = req.user.id;
  try {
    const { data: req_, error } = await supabase
      .from('payment_requests')
      .select('id, status, student_id')
      .eq('id', req.params.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error || !req_) return res.status(404).json({ message: 'Request not found.' });
    if (!['draft', 'claimed'].includes(req_.status)) {
      return res.status(400).json({ message: 'Only draft or claimed requests can be cancelled.' });
    }

    const { error: uErr } = await supabase
      .from('payment_requests')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id);

    if (uErr) throw uErr;
    res.json({ message: 'Request cancelled.' });
  } catch (err) {
    console.error('Cancel error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/payments/:id/remind
// Student reminds admin (once per hour, only while Claimed).
router.post('/:id/remind', authMiddleware, async (req, res) => {
  const studentId = req.user.id;
  try {
    const { data: req_, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error || !req_) return res.status(404).json({ message: 'Request not found.' });
    if (req_.status !== 'claimed') {
      return res.status(400).json({ message: 'Can only remind on claimed requests.' });
    }

    // Rate limit: once per hour
    if (req_.reminded_at) {
      const hoursSince = (Date.now() - new Date(req_.reminded_at).getTime()) / 3600000;
      if (hoursSince < 1) {
        return res.status(429).json({ message: 'You can only remind once per hour.' });
      }
    }

    const { data: updated, error: uErr } = await supabase
      .from('payment_requests')
      .update({
        reminded_at: new Date().toISOString(),
        remind_count: (req_.remind_count || 0) + 1
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (uErr) throw uErr;

    const io = req.app.get('io');
    emitToAdminRoom(io, 'payment:reminded', { requestId: updated.id });

    res.json({ message: 'Admin has been reminded.', request: updated });
  } catch (err) {
    console.error('Remind error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/payments/my-access
// Get all unlocked courses for current student
router.get('/my-access', authMiddleware, async (req, res) => {
  const studentId = req.user.id;
  try {
    const { data, error } = await supabase
      .from('course_access')
      .select('*, course:courses(id, name, slug, semester, category:categories(id, name, slug))')
      .eq('student_id', studentId)
      .eq('status', 'unlocked')
      .order('granted_at', { ascending: false });

    if (error) {
      // Return empty array gracefully if table does not exist yet
      return res.json([]);
    }
    res.json(data || []);
  } catch (err) {
    console.error('My access error:', err.message);
    res.json([]);
  }
});

// GET /api/payments/my
// Get current student's payment requests
router.get('/my', authMiddleware, async (req, res) => {
  const studentId = req.user.id;
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.json([]);
    }
    res.json(data || []);
  } catch (err) {
    console.error('My payments error:', err.message);
    res.json([]);
  }
});

// GET /api/payments/course-status/:courseId
// Check one course's access state for the current student
router.get('/course-status/:courseId', authMiddleware, async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.params;
  try {
    // Check access
    const { data: access, error: aErr } = await supabase
      .from('course_access')
      .select('status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!aErr && access?.status === 'unlocked') return res.json({ status: 'unlocked' });
    if (!aErr && access?.status === 'revoked') return res.json({ status: 'revoked' });

    // Check pending claimed request
    const { data: pending, error: pErr } = await supabase
      .from('payment_requests')
      .select('id, status, payment_code, claimed_at, reject_reason, reminded_at')
      .eq('student_id', studentId)
      .eq('status', 'claimed')
      .contains('course_ids', [courseId])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pErr && pending) return res.json({ status: 'pending', request: pending });

    // Check if recently rejected
    const { data: rejected, error: rErr } = await supabase
      .from('payment_requests')
      .select('id, status, reject_reason, created_at')
      .eq('student_id', studentId)
      .eq('status', 'rejected')
      .contains('course_ids', [courseId])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rErr && rejected) return res.json({ status: 'rejected', request: rejected });

    return res.json({ status: 'locked' });
  } catch (err) {
    return res.json({ status: 'locked' });
  }
});

module.exports = router;

