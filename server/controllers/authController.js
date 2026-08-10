const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../services/emailService');
const { sendTokenResponse, generateAccessToken } = require('../utils/tokenUtils');

// @desc    Register student
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = new User({ name, email, password, role: 'student' });
    const otp = user.generateOTP();
    await user.save();

    try {
      await sendOTPEmail(email, name, otp, 'verification');
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for OTP.',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified' });
    }

    const otp = user.generateOTP();
    await user.save();

    await sendOTPEmail(user.email, user.name, otp, 'verification');

    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Login (admin + student)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.role === 'student' && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        userId: user._id,
        requiresVerification: true,
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password — send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = user.generateOTP();
    await user.save();

    await sendOTPEmail(user.email, user.name, otp, 'forgot');

    res.json({
      success: true,
      message: 'OTP sent to your email',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (uses httpOnly cookie)
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const accessToken = generateAccessToken(user._id);
    res.json({ success: true, accessToken });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    },
  });
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, verifyOTP, resendOTP, login, forgotPassword, resetPassword, refreshToken, getMe, logout };
