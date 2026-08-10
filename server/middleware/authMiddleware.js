const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify access token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

// Require student role
const requireStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Student access required' });
};

// Require verified account
const requireVerified = (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Please verify your email first' });
};

module.exports = { protect, requireAdmin, requireStudent, requireVerified };
