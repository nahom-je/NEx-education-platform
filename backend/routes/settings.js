// backend/routes/settings.js
// Public GET for frontend; protected POST for admin.

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/settings — returns all settings as { key: value } object
router.get('/', async (req, res) => {
  try {
    const map = {};

    // Try fetching from database settings table
    try {
      const { data, error } = await supabase.from('settings').select('key, value');
      if (!error && data) {
        data.forEach(row => { map[row.key] = row.value; });
      }
    } catch (dbErr) {
      // Table might not exist yet before migration is run
    }

    // Always fallback to environment variables
    if (!map.course_price) map.course_price = process.env.COURSE_PRICE || '150';
    if (!map.cbe_account_number) map.cbe_account_number = process.env.CBE_ACCOUNT_NUMBER || '1000531330041';
    if (!map.cbe_account_name) map.cbe_account_name = process.env.CBE_ACCOUNT_NAME || 'Bereket Alemayehu';
    if (!map.telebirr_number) map.telebirr_number = process.env.TELEBIRR_NUMBER || '0974715586';
    if (!map.telebirr_name) map.telebirr_name = process.env.TELEBIRR_NAME || 'Walala shumi';
    if (!map.telegram_admin_handle) map.telegram_admin_handle = process.env.TELEGRAM_ADMIN_HANDLE || 'bekiJng';
    if (!map.telegram_admin_id) map.telegram_admin_id = process.env.TELEGRAM_ADMIN_ID || '5627133176';

    res.json(map);
  } catch (err) {
    console.error('Settings GET error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/settings — admin only, update one or many settings
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });

  const updates = req.body; // { key: value, ... }
  try {
    for (const [key, value] of Object.entries(updates)) {
      const { error } = await supabase.from('settings').upsert({
        key,
        value: String(value),
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      if (error) throw error;
    }
    res.json({ message: 'Settings updated.' });
  } catch (err) {
    console.error('Settings POST error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

