const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../services/emailService');
const {
  sendTokenResponse,
  generateAccessToken,
} = require('../utils/tokenUtils');

// Helper to mask sensitive email addresses in server logs
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
};

// ============================================================
// SEND OTP (Standalone / Manual OTP Request)
// POST /api/auth/send-otp
// ============================================================
const sendOTP = async (req, res, next) => {
  try {
    const { email, userId } = req.body;

    if (!email && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Email address or User ID is required',
      });
    }

    let user;
    if (userId) {
      user = await User.findById(userId).select('+otpLastSent');
    } else if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      user = await User.findOne({ email: normalizedEmail }).select('+otpLastSent');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log(`🔑 [OTP_REQUEST_STARTED] User: ${maskEmail(user.email)}`);

    // Resend cooldown throttling (60 seconds)
    if (user.otpLastSent) {
      const timeDiff = Date.now() - new Date(user.otpLastSent).getTime();
      if (timeDiff < 60000) {
        const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting a new OTP.`,
        });
      }
    }

    const rawOtp = user.generateOTP();
    await user.save();
    console.log(`🔒 [OTP_STORED] Hashed OTP generated for ${maskEmail(user.email)}`);

    const reqId = `otp_send_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`📧 [OTP_PROVIDER_REQUEST_STARTED] [${reqId}] Sending email to ${maskEmail(user.email)}`);
    try {
      await sendOTPEmail(user.email, user.name, rawOtp, 'verification', reqId);
      console.log(`✅ [OTP_PROVIDER_SUCCESS] [${reqId}] OTP delivered to ${maskEmail(user.email)}`);
    } catch (emailError) {
      console.error(`❌ [OTP_PROVIDER_FAILURE] [${reqId}] Email dispatch failed for ${maskEmail(user.email)}: ${emailError.message}`);
      return res.status(400).json({
        success: false,
        message: 'Unable to send OTP email. Please check your email address and try again.',
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      userId: user._id,
      ...(process.env.NODE_ENV === 'development' ? { devOtp: rawOtp } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REGISTER STUDENT
// POST /api/auth/register
// ============================================================
const register = async (req, res, next) => {
  const reqId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    console.log(`📥 [REGISTRATION_REQUEST_RECEIVED] [${reqId}]`);
    console.log(`🔍 [REGISTRATION_VALIDATION_STARTED] [${reqId}]`);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log(`❌ [REGISTRATION_VALIDATION_FAILED] [${reqId}] Missing required fields`);
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      console.log(`❌ [REGISTRATION_VALIDATION_FAILED] [${reqId}] Password under 6 chars`);
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    console.log(`🔍 [USER_LOOKUP_STARTED] [${reqId}] Email: ${maskEmail(normalizedEmail)}`);
    let user = await User.findOne({ email: normalizedEmail });
    console.log(`✅ [USER_LOOKUP_COMPLETED] [${reqId}] Existing user found: ${!!user}`);

    if (user) {
      if (user.isVerified) {
        console.log(`⚠️ [REGISTRATION_FAILED] [${reqId}] User already verified`);
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please login instead.',
        });
      }
      console.log(`📝 [USER_CREATE_STARTED] [${reqId}] Updating unverified user details`);
      user.name = name.trim();
      user.password = password; // pre-save hook handles hashing
    } else {
      console.log(`📝 [USER_CREATE_STARTED] [${reqId}] Creating new student user`);
      user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'student',
        isVerified: false,
      });
    }

    console.log(`🔑 [PASSWORD_HASH_STARTED] [${reqId}] Generating OTP & hashing password`);
    const rawOtp = user.generateOTP();
    await user.save();
    console.log(`✅ [PASSWORD_HASH_COMPLETED] & [USER_CREATE_COMPLETED] [${reqId}] User ID: ${user._id}`);

    console.log(`📧 [EMAIL_SEND_STARTED] [${reqId}] Dispatching verification email to ${maskEmail(user.email)}`);
    try {
      await sendOTPEmail(user.email, user.name, rawOtp, 'verification', reqId);
      console.log(`✅ [EMAIL_SEND_COMPLETED] [${reqId}] OTP delivered successfully`);
    } catch (emailError) {
      console.error(`❌ [EMAIL_SEND_FAILED] [${reqId}] Email dispatch failed: ${emailError.message}`);
      return res.status(400).json({
        success: false,
        message: "We couldn't send the verification email right now. Please try again.",
        userId: user._id,
      });
    }

    console.log(`🎉 [REGISTRATION_SUCCESS] [${reqId}] Registration complete for ${maskEmail(user.email)}`);
    return res.status(201).json({
      success: true,
      message: 'Registration successful. A 6-digit OTP code has been sent to your email.',
      userId: user._id,
      ...(process.env.NODE_ENV === 'development' ? { devOtp: rawOtp } : {}),
    });
  } catch (error) {
    console.error(`❌ [REGISTRATION_FAILED] [${reqId}] Unexpected exception: ${error.message}`);
    next(error);
  }
};

// ============================================================
// VERIFY OTP
// POST /api/auth/verify-otp
// ============================================================
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, email, otp } = req.body;

    if ((!userId && !email) || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User identifier (userId or email) and OTP code are required',
      });
    }

    const cleanOtp = otp.toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must contain exactly 6 digits',
      });
    }

    let user;
    if (userId) {
      user = await User.findById(userId).select('+otp +otpExpiry +otpAttempts');
    } else if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry +otpAttempts');
    }

    console.log(`🔍 [OTP_VERIFICATION_STARTED] Identifier: ${userId || maskEmail(email)}`);

    if (!user) {
      console.log(`❌ [OTP_LOOKUP_FAILURE] User not found for identifier`);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log(`✅ [OTP_LOOKUP_SUCCESS] User found: ${maskEmail(user.email)}`);

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. Please login.',
      });
    }

    // Check failed attempts (limit: 5)
    if (user.otpAttempts >= 5) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      await user.save();
      console.log(`❌ [OTP_ATTEMPTS_EXCEEDED] Invalidated OTP for ${maskEmail(user.email)} due to 5+ failed attempts`);
      return res.status(400).json({
        success: false,
        message: 'Too many failed OTP attempts. Please request a new OTP.',
      });
    }

    // Check expiration
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      console.log(`❌ [OTP_EXPIRED] OTP expired for ${maskEmail(user.email)}`);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Timing-safe verification of SHA-256 hashed OTP
    const isValid = user.verifyOTPCode(cleanOtp);

    if (!isValid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      console.log(`❌ [OTP_INVALID] Incorrect OTP entered for ${maskEmail(user.email)} (Attempt ${user.otpAttempts}/5)`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the code sent to your email.',
      });
    }

    // Successful OTP verification
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    console.log(`🎉 [OTP_VERIFIED] Email successfully verified for ${maskEmail(user.email)}`);
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
  return sendOTP(req, res, next);
};

// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { name: new RegExp('^' + escapedEmail + '$', 'i') },
        { name: new RegExp('^' + escapedEmail, 'i') },
      ],
    }).select('+password +otpLastSent');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Unverified students must complete OTP verification
    if (user.role === 'student' && !user.isVerified) {
      let rawOtp;
      // Re-use active OTP if sent within last 60s, else generate fresh
      const timeDiff = user.otpLastSent ? Date.now() - new Date(user.otpLastSent).getTime() : 999999;
      if (timeDiff > 60000) {
        rawOtp = user.generateOTP();
        await user.save();
        console.log(`🔑 [OTP_GENERATED] Login unverified fresh OTP generated for ${maskEmail(user.email)}`);

        const reqId = `login_unverified_otp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        try {
          await sendOTPEmail(user.email, user.name, rawOtp, 'verification', reqId);
          console.log(`✅ [OTP_PROVIDER_SUCCESS] [${reqId}] Login OTP delivered to ${maskEmail(user.email)}`);
        } catch (emailErr) {
          console.error(`❌ [OTP_PROVIDER_FAILURE] [${reqId}] Login OTP delivery error: ${emailErr.message}`);
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Please verify your email first. An OTP code has been sent to your email.',
        userId: user._id,
        email: user.email,
        requiresVerification: true,
        ...(rawOtp && process.env.NODE_ENV === 'development' ? { devOtp: rawOtp } : {}),
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
        message: 'Email address is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpLastSent');

    // Return uniform message to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset OTP has been sent.',
      });
    }

    // Resend cooldown throttling (60 seconds)
    if (user.otpLastSent) {
      const timeDiff = Date.now() - new Date(user.otpLastSent).getTime();
      if (timeDiff < 60000) {
        const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting another reset code.`,
        });
      }
    }

    const rawOtp = user.generateOTP();
    await user.save();

    const reqId = `forgot_otp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`📧 [OTP_PROVIDER_REQUEST_STARTED] [${reqId}] Dispatching forgot password OTP to ${maskEmail(user.email)}`);
    try {
      await sendOTPEmail(user.email, user.name, rawOtp, 'forgot', reqId);
      console.log(`✅ [OTP_PROVIDER_SUCCESS] [${reqId}] Forgot password OTP sent to ${maskEmail(user.email)}`);
    } catch (emailErr) {
      console.error(`❌ [OTP_PROVIDER_FAILURE] [${reqId}] Forgot password email failed: ${emailErr.message}`);
      return res.status(500).json({
        success: false,
        message: 'Unable to send password reset OTP. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent to your email',
      userId: user._id,
      ...(process.env.NODE_ENV === 'development' ? { devOtp: rawOtp } : {}),
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
    const { userId, email, otp, newPassword } = req.body;

    if ((!userId && !email) || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User identifier, OTP code and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const cleanOtp = otp.toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must contain exactly 6 digits',
      });
    }

    let user;
    if (userId) {
      user = await User.findById(userId).select('+otp +otpExpiry +otpAttempts');
    } else if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry +otpAttempts');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.otpAttempts >= 5) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many failed OTP attempts. Please request a new reset code.',
      });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new reset code.',
      });
    }

    const isValid = user.verifyOTPCode(cleanOtp);
    if (!isValid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check the code sent to your email.',
      });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    console.log(`🎉 [PASSWORD_RESET_SUCCESS] Password successfully reset for ${maskEmail(user.email)}`);

    return res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
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

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const accessToken = generateAccessToken(user._id);

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
  sendOTP,
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