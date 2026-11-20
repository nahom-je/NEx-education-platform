const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token (Bearer <token>)
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded.user;

    // Check device integrity for students (prevent sharing exported token across devices)
    const clientDeviceId = req.header('x-device-id');
    if (req.user?.role !== 'admin' && req.user?.deviceId && clientDeviceId && req.user.deviceId !== clientDeviceId) {
      return res.status(401).json({
        deviceLocked: true,
        message: 'Device mismatch. Your session is active on a different device.'
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
