const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { askStudyAssistant } = require('../services/aiService');

// In-memory student rate limiting: Map of userId -> array of timestamps
// (Can be moved to a Redis store or database table in production)
const userRateLimits = new Map();
const MAX_QUESTIONS_PER_HOUR = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Global limit to safeguard quota (e.g., max 100 requests per minute platform-wide)
const globalRequestTimestamps = [];
const MAX_GLOBAL_PER_MINUTE = 60;
const GLOBAL_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId) {
  const now = Date.now();

  // 1. Check Global Limit
  while (globalRequestTimestamps.length > 0 && globalRequestTimestamps[0] < now - GLOBAL_WINDOW_MS) {
    globalRequestTimestamps.shift();
  }
  if (globalRequestTimestamps.length >= MAX_GLOBAL_PER_MINUTE) {
    return { allowed: false, message: 'Platform AI capacity is temporarily reached. Please try again in a minute.' };
  }

  // 2. Check Per-Student Limit
  let userTimestamps = userRateLimits.get(userId) || [];
  userTimestamps = userTimestamps.filter(t => t > now - RATE_LIMIT_WINDOW_MS);
  userRateLimits.set(userId, userTimestamps);

  if (userTimestamps.length >= MAX_QUESTIONS_PER_HOUR) {
    const oldestTimestamp = userTimestamps[0];
    const minutesLeft = Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW_MS - now) / 60000);
    return { 
      allowed: false, 
      message: `Hourly question limit reached (${MAX_QUESTIONS_PER_HOUR}/hour). Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.` 
    };
  }

  // Record request
  userTimestamps.push(now);
  globalRequestTimestamps.push(now);
  return { allowed: true };
}

/**
 * @route   POST /api/ai/ask
 * @desc    Ask a study question to the AI assistant
 * @access  Private (JWT required)
 */
router.post('/ask', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User identification required from token' });
    }

    // 1. Check rate limit
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return res.status(429).json({ message: rateCheck.message });
    }

    // 2. Validate input
    const { question, context, history } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ message: 'Question cannot be empty' });
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length > 1000) {
      return res.status(400).json({ message: 'Question exceeds the maximum length of 1000 characters' });
    }

    // Sanitize context if provided
    const safeContext = context && typeof context === 'object' ? {
      category: typeof context.category === 'string' ? context.category.substring(0, 100) : '',
      semester: typeof context.semester === 'string' ? context.semester.substring(0, 50) : '',
      course: typeof context.course === 'string' ? context.course.substring(0, 100) : ''
    } : null;

    // 3. Ask assistant
    const response = await askStudyAssistant({
      question: trimmedQuestion,
      context: safeContext,
      history
    });

    res.json({
      answer: response.answer,
      cached: response.cached,
      provider: response.provider || null
    });
  } catch (err) {
    if (err.status === 503) {
      return res.status(503).json({ message: err.message });
    }
    next(err);
  }
});

module.exports = router;

