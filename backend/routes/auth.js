const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const { normalizeEthiopianPhone } = require('../utils/phone');
const deviceService = require('../services/deviceService');

// ── In-Memory Rate Limiter ──────────────────────────────────────────────────
// Max 5 failed attempts per 15 minutes per phone number & per IP
const loginAttempts = new Map(); // key: identifier -> { count, firstAttempt }
const ATTEMPT_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 mins

function isRateLimited(key) {
  const record = loginAttempts.get(key);
  if (!record) return false;

  const now = Date.now();
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return record.count >= ATTEMPT_LIMIT;
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || (now - record.firstAttempt > WINDOW_MS)) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function clearFailedAttempts(key) {
  loginAttempts.delete(key);
}

// Helper to format user response consistently for React frontend
const formatUser = (user) => {
  const { password, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    _id: user.id
  };
};

// @route   POST api/auth/register
// @desc    Register a new student with Name, Phone, and Password
// @access  Public
router.post('/register', async (req, res) => {
  const { name, phone, password } = req.body;

  // 1. Validate Name
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    return res.status(400).json({ message: 'Name must be between 2 and 60 characters.' });
  }

  // 2. Validate & Normalize Phone
  const normalizedPhone = normalizeEthiopianPhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({
      message: 'Invalid phone number. Please enter a valid Ethiopian number (e.g. 09XXXXXXXX, 07XXXXXXXX, or +2519XXXXXXXX).'
    });
  }

  // 3. Validate Password
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    // 4. Check if phone already registered
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingUser) {
      return res.status(400).json({
        message: 'This phone number is already registered. Please sign in instead.'
      });
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Insert new student into Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        phone: normalizedPhone,
        password: hashedPassword,
        must_change_password: false,
        university: 'Jimma University',
        bio: 'Jimma University student.',
        role: 'student',
        status: 'active'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 7. Register device for student
    const clientDeviceId = req.body.deviceId || req.header('x-device-id');
    const clientDeviceName = req.body.deviceName || req.header('x-device-name') || 'Unknown Device';
    if (newUser.role !== 'admin' && clientDeviceId) {
      await deviceService.registerUserDevice(newUser.id, clientDeviceId, clientDeviceName);
    }

    // 8. Issue JWT
    const payload = { user: { id: newUser.id, role: newUser.role, deviceId: clientDeviceId } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: newUser.id,
          _id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          must_change_password: false
        }
      });
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server Error during registration.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user by Phone Number and Password
// @access  Public
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

  // 1. Validate input presence
  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone number and password are required.' });
  }

  // 2. Normalize phone
  const normalizedPhone = normalizeEthiopianPhone(phone);
  const rateLimitKey = normalizedPhone || `${clientIp}_${phone}`;

  // 3. Check rate limit (5 failed attempts per 15 mins)
  if (isRateLimited(rateLimitKey) || isRateLimited(clientIp)) {
    return res.status(429).json({
      message: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
    });
  }

  if (!normalizedPhone) {
    recordFailedAttempt(rateLimitKey);
    recordFailedAttempt(clientIp);
    return res.status(400).json({ message: 'Invalid phone number or password.' });
  }

  try {
    // 4. Fetch user by normalized phone
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // If user not found, reject with generic message
    if (!user) {
      recordFailedAttempt(normalizedPhone);
      recordFailedAttempt(clientIp);
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    // 5. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordFailedAttempt(normalizedPhone);
      recordFailedAttempt(clientIp);
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    // Clear failed attempts upon successful login
    clearFailedAttempts(normalizedPhone);
    clearFailedAttempts(clientIp);

    // 6. Check if user account is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact admin on Telegram (@bekiJng).'
      });
    }

    // 7. Check device lock (enforce 1 registered device per student; admins exempt)
    const clientDeviceId = req.body.deviceId || req.header('x-device-id');
    const clientDeviceName = req.body.deviceName || req.header('x-device-name') || 'Unknown Device';

    if (user.role !== 'admin' && clientDeviceId) {
      const registeredDevice = await deviceService.getUserDevice(user.id);

      if (!registeredDevice) {
        // First login — bind this device
        await deviceService.registerUserDevice(user.id, clientDeviceId, clientDeviceName);
      } else if (registeredDevice.deviceId !== clientDeviceId) {
        // Device mismatch! Account is locked to another device
        return res.status(403).json({
          deviceLocked: true,
          registeredDeviceName: registeredDevice.deviceName || 'another device',
          message: `This account is locked to another device (${registeredDevice.deviceName || 'another phone'}). Only 1 device is allowed per student. If you switched phones or cleared your browser, message @bekiJng on Telegram to reset your device.`
        });
      } else {
        // Device matches — update last active time in background
        deviceService.touchUserDevice(user.id, registeredDevice);
      }
    }

    // 8. Issue JWT
    const payload = { user: { id: user.id, role: user.role, deviceId: clientDeviceId } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          _id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          must_change_password: !!user.must_change_password
        }
      });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server Error during sign-in.' });
  }
});

// @route   POST api/auth/change-password
// @desc    Change password (for logged-in student or after temporary reset)
// @access  Private
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, password, must_change_password')
      .eq('id', req.user.id)
      .maybeSingle();

    if (fetchError || !user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If user doesn't have must_change_password flagged, verify current password
    if (!user.must_change_password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        must_change_password: false
      })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Server Error updating password.' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(formatUser(user));
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
