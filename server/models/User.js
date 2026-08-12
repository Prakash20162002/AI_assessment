const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'student'],
      default: 'student',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    otpLastSent: {
      type: Date,
      select: false,
    },
    profileImage: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Cryptographically secure 6-digit OTP generation with SHA-256 hashed storage
userSchema.methods.generateOTP = function () {
  const crypto = require('crypto');
  // Generate random integer between 0 and 999999, format as 6-digit string (preserves leading zeros)
  const rawOtp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  
  // Store SHA-256 hash in database
  this.otp = crypto.createHash('sha256').update(rawOtp).digest('hex');
  this.otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || '10', 10) * 60 * 1000);
  this.otpAttempts = 0;
  this.otpLastSent = new Date();

  return rawOtp;
};

// Timing-safe verification of entered OTP against stored SHA-256 hash
userSchema.methods.verifyOTPCode = function (enteredOtp) {
  if (!this.otp || !enteredOtp) return false;
  const crypto = require('crypto');
  const cleanEntered = enteredOtp.toString().trim();
  const enteredHash = crypto.createHash('sha256').update(cleanEntered).digest('hex');

  const storedHashBuf = Buffer.from(this.otp, 'hex');
  const enteredHashBuf = Buffer.from(enteredHash, 'hex');

  if (storedHashBuf.length !== enteredHashBuf.length) return false;
  return crypto.timingSafeEqual(storedHashBuf, enteredHashBuf);
};

module.exports = mongoose.model('User', userSchema);
