// backend/middleware/courseAccess.js
// Enforces that student has unlocked access to course materials.
// Admins have universal master access.

const supabase = require('../lib/supabase');

const courseAccessMiddleware = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required to view course materials.' });
    }

    // Universal Admin Access
    if (user.role === 'admin') {
      return next();
    }

    const studentId = user.id;
    let courseId = req.params.courseId || req.body.courseId || req.query.courseId;
    const resourceId = req.params.resourceId || req.params.id;

    if (!courseId && resourceId) {
      const { data: resource, error: rErr } = await supabase
        .from('resources')
        .select('id, course_id')
        .eq('id', resourceId)
        .maybeSingle();

      if (rErr || !resource) {
        return res.status(404).json({ message: 'Resource not found.' });
      }
      courseId = resource.course_id;
    }

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID could not be resolved.' });
    }

    // Verify unlocked status in course_access
    const { data: access, error: aErr } = await supabase
      .from('course_access')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'unlocked')
      .maybeSingle();

    if (aErr) throw aErr;

    if (!access) {
      return res.status(403).json({
        locked: true,
        message: 'This material is locked. Please purchase the semester package or contact admin to unlock.',
        courseId,
        buyUrl: '/pricing'
      });
    }

    next();
  } catch (err) {
    console.error('courseAccess middleware error:', err.message);
    res.status(500).json({ message: 'Server error checking course access.' });
  }
};

module.exports = courseAccessMiddleware;
