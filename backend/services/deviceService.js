const supabase = require('../lib/supabase');

/**
 * Get device record for a user
 * @param {string} userId 
 * @returns {Promise<{ deviceId: string, deviceName: string, registeredAt: string, lastActiveAt: string } | null>}
 */
async function getUserDevice(userId) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `device:${userId}`)
      .maybeSingle();

    if (error || !data || !data.value) return null;
    return JSON.parse(data.value);
  } catch (err) {
    console.error('Error in getUserDevice:', err.message);
    return null;
  }
}

/**
 * Register or bind device for a user
 * @param {string} userId 
 * @param {string} deviceId 
 * @param {string} deviceName 
 */
async function registerUserDevice(userId, deviceId, deviceName) {
  try {
    const now = new Date().toISOString();
    const payload = {
      deviceId,
      deviceName: deviceName || 'Unknown Device',
      registeredAt: now,
      lastActiveAt: now
    };

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: `device:${userId}`,
        value: JSON.stringify(payload),
        description: `Registered student device for ${userId}`,
        updated_at: now
      }, { onConflict: 'key' });

    if (error) {
      console.error('Error upserting device to settings:', error);
    }

    return payload;
  } catch (err) {
    console.error('Error in registerUserDevice:', err.message);
    return null;
  }
}

/**
 * Update last active timestamp for existing device
 */
async function touchUserDevice(userId, existingRecord) {
  try {
    const updated = {
      ...existingRecord,
      lastActiveAt: new Date().toISOString()
    };
    await supabase
      .from('settings')
      .update({
        value: JSON.stringify(updated),
        updated_at: new Date().toISOString()
      })
      .eq('key', `device:${userId}`);
  } catch (err) {
    // Non-critical background touch, ignore
  }
}

/**
 * Reset / unbind device for a user (called by Admin)
 * @param {string} userId 
 */
async function resetUserDevice(userId) {
  try {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', `device:${userId}`);
    
    if (error) {
      console.error('Error deleting device key:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error resetting user device:', err.message);
    return false;
  }
}

/**
 * Get all registered devices map for admin users view
 * @returns {Promise<Object.<string, { deviceId: string, deviceName: string, registeredAt: string, lastActiveAt: string }>>}
 */
async function getAllUserDevices() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'device:%');

    if (error || !data) return {};
    const map = {};
    data.forEach(item => {
      try {
        const userId = item.key.replace('device:', '');
        map[userId] = JSON.parse(item.value);
      } catch (e) {}
    });
    return map;
  } catch (err) {
    console.error('Error fetching all user devices:', err.message);
    return {};
  }
}

module.exports = {
  getUserDevice,
  registerUserDevice,
  touchUserDevice,
  resetUserDevice,
  getAllUserDevices
};
