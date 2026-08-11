const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../services/emailService');
const {
  sendTokenResponse,
  generateAccessToken,
} = require('../utils/tokenUtils');

// ============================================================
// REGISTER STUDENT
// POST /api/auth/register
// ============================================================
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create student
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'student',
      isVerified: false,
    });

    // Generate OTP
    const otp = user.generateOTP();

    // Save user
    await user.save();

    let emailSent = true;
    try {
      await sendOTPEmail(
        user.email,
        user.name,
        otp,
        'verification'
      );
    } catch (emailErr) {
      emailSent = false;
      console.error('📧 [SMTP ERROR] Email send failed:', emailErr.message);
    }

    console.log(`🔑 [OTP CODE] Verification OTP for ${user.email}: ${otp}`);

    return res.status(201).json({
      success: true,
      message: emailSent
        ? 'Registration successful. Please check your email for OTP.'
        : `Registration successful. (Email delivery failed — use code ${otp})`,
      userId: user._id,
      devOtp: (!emailSent || process.env.NODE_ENV === 'development') ? otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// VERIFY OTP
// POST /api/auth/verify-otp
// ============================================================
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required',
      });
    }

    const user = await User.findById(userId).select(
      '+otp +otpExpiry'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified',
      });
    }

    if (!user.otp || user.otp !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    if (
      !user.otpExpiry ||
      user.otpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// RESEND OTP
// POST /api/auth/resend-otp
// ============================================================
const resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified',
      });
    }

    const otp = user.generateOTP();

    await user.save();

    let emailSent = true;
    try {
      await sendOTPEmail(
        user.email,
        user.name,
        otp,
        'verification'
      );
    } catch (emailErr) {
      emailSent = false;
      console.error('📧 [SMTP ERROR] Resend OTP failed:', emailErr.message);
    }

    console.log(`🔑 [RESEND OTP CODE] Verification OTP for ${user.email}: ${otp}`);

    return res.json({
      success: true,
      message: emailSent ? 'OTP resent successfully' : `OTP resent. (Email failed — use code ${otp})`,
      devOtp: (!emailSent || process.env.NODE_ENV === 'development') ? otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // IMPORTANT:
    // Prevent bcrypt.compare(undefined, ...)
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Temporary safe debugging.
    // NEVER log the actual password.
    console.log('LOGIN DEBUG:', {
      email: normalizedEmail,
      hasPassword: Boolean(password),
      passwordLength: password.length,
    });

    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { name: new RegExp('^' + escapedEmail + '$', 'i') },
        { name: new RegExp('^' + escapedEmail, 'i') },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password only after confirming it exists
    const isPasswordValid =
      await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Students must verify email
    if (
      user.role === 'student' &&
      !user.isVerified
    ) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        userId: user._id,
        requiresVerification: true,
      });
    }

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ============================================================
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message:
          'If that email exists, an OTP has been sent.',
      });
    }

    const otp = user.generateOTP();

    await user.save();

    await sendOTPEmail(
      user.email,
      user.name,
      otp,
      'forgot'
    );

    return res.json({
      success: true,
      message: 'OTP sent to your email',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ============================================================
const resetPassword = async (req, res, next) => {
  try {
    const {
      userId,
      otp,
      newPassword,
    } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          'User ID, OTP and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(userId).select(
      '+otp +otpExpiry'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.otp || user.otp !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    if (
      !user.otpExpiry ||
      user.otpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    return res.json({
      success: true,
      message:
        'Password reset successfully. Please login.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REFRESH ACCESS TOKEN
// POST /api/auth/refresh
// ============================================================
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const accessToken = generateAccessToken(
      user._id
    );

    return res.json({
      success: true,
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

// ============================================================
// GET CURRENT USER
// GET /api/auth/me
// ============================================================
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

// ============================================================
// LOGOUT
// POST /api/auth/logout
// ============================================================
const logout = (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  getMe,
  logout,
};