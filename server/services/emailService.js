const nodemailer = require('nodemailer');

// Singleton cached transporters map
const transporters = new Map();

const getTransporter = (portOverride = null) => {
  const configuredPort = parseInt(process.env.EMAIL_PORT || '587', 10);
  const port = portOverride || configuredPort;
  const key = `smtp_${port}`;

  if (!transporters.has(key)) {
    // Port 465 = SSL (secure: true). Port 587 = STARTTLS (secure: false, requireTLS: true)
    const isSecure = port === 465;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port,
      secure: isSecure,
      requireTLS: port === 587,
      family: 4, // Force IPv4 to prevent ENETUNREACH IPv6 failures on cloud instances
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    });
    transporters.set(key, transporter);
  }

  return transporters.get(key);
};

let fallbackTransporter = null;

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
};

// Differentiate transient network/route errors from permanent auth/validation errors
const isTransientError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toUpperCase();

  if (
    code === 'EAUTH' ||
    msg.includes('authentication failed') ||
    msg.includes('535') ||
    msg.includes('invalid recipient') ||
    msg.includes('550')
  ) {
    return false; // Permanent failure
  }

  return (
    code === 'ENETUNREACH' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'EHOSTUNREACH' ||
    code === 'ESOCKETTIMEDOUT' ||
    code === 'ENOTFOUND' ||
    msg.includes('timeout') ||
    msg.includes('connect')
  );
};

const sendEmail = async ({ to, subject, text, html, reqId = 'sys' }) => {
  const senderAddress = process.env.EMAIL_USER || 'no-reply@devphoenix.com';
  const mailOptions = {
    from: `"DevPhoenix Technologies LLP" <${senderAddress}>`,
    to,
    subject,
    text,
    html,
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High',
      'Importance': 'High',
    },
  };

  const configuredPort = parseInt(process.env.EMAIL_PORT || '587', 10);
  console.log(`📧 [EMAIL_SEND_STARTED] [${reqId}] Recipient: ${maskEmail(to)}`);

  // --- 1. Primary SMTP Attempt ---
  const startTime = Date.now();
  try {
    console.log(`📡 [SMTP_PRIMARY_ATTEMPT] [${reqId}] Port ${configuredPort} (IPv4 preferred)`);
    const primaryTransporter = getTransporter(configuredPort);
    const info = await primaryTransporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;
    console.log(`✅ [SMTP_PRIMARY_SUCCESS] [${reqId}] Port ${configuredPort} in ${duration}ms (ID: ${info.messageId})`);
    console.log(`🎉 [EMAIL_SEND_COMPLETED] [${reqId}] Delivered via Port ${configuredPort}`);
    return { success: true, messageId: info.messageId };
  } catch (primaryErr) {
    const primaryDuration = Date.now() - startTime;
    const isTransient = isTransientError(primaryErr);

    if (isTransient) {
      console.warn(`⚠️ [SMTP_PRIMARY_TRANSIENT_FAILURE] [${reqId}] Port ${configuredPort} failed in ${primaryDuration}ms: ${primaryErr.message} (Code: ${primaryErr.code || 'TIMEOUT'})`);
    } else {
      console.error(`❌ [SMTP_PRIMARY_PERMANENT_FAILURE] [${reqId}] Port ${configuredPort} failed in ${primaryDuration}ms: ${primaryErr.message}`);
      throw new Error(`Email authentication failed: ${primaryErr.message}`);
    }

    // --- 2. Controlled Retry on Primary Port (if transient) ---
    if (isTransient) {
      try {
        console.log(`🔄 [SMTP_RETRY_ATTEMPT] [${reqId}] Retrying Port ${configuredPort} after backoff...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const retryTransporter = getTransporter(configuredPort);
        const retryInfo = await retryTransporter.sendMail(mailOptions);
        console.log(`✅ [SMTP_PRIMARY_SUCCESS] [${reqId}] Retry Port ${configuredPort} succeeded (ID: ${retryInfo.messageId})`);
        console.log(`🎉 [EMAIL_SEND_COMPLETED] [${reqId}] Delivered via Port ${configuredPort} retry`);
        return { success: true, messageId: retryInfo.messageId };
      } catch (retryErr) {
        console.warn(`⚠️ [SMTP_RETRY_FAILURE] [${reqId}] Retry Port ${configuredPort} failed: ${retryErr.message}`);
      }
    }

    // --- 3. Secondary Port Failover (465 if 587, 587 if 465) ---
    const secondaryPort = configuredPort === 465 ? 587 : 465;
    const failoverStartTime = Date.now();
    try {
      console.log(`📡 [SMTP_FALLBACK_ATTEMPT] [${reqId}] Failover to Port ${secondaryPort} (IPv4 preferred)`);
      const secondaryTransporter = getTransporter(secondaryPort);
      const secondaryInfo = await secondaryTransporter.sendMail(mailOptions);
      const failoverDuration = Date.now() - failoverStartTime;
      console.log(`✅ [SMTP_FALLBACK_SUCCESS] [${reqId}] Port ${secondaryPort} in ${failoverDuration}ms (ID: ${secondaryInfo.messageId})`);
      console.log(`🎉 [EMAIL_SEND_COMPLETED] [${reqId}] Delivered via Failover Port ${secondaryPort}`);
      return { success: true, messageId: secondaryInfo.messageId };
    } catch (secondaryErr) {
      const failoverDuration = Date.now() - failoverStartTime;
      console.error(`❌ [SMTP_FALLBACK_FAILURE] [${reqId}] Port ${secondaryPort} failed in ${failoverDuration}ms: ${secondaryErr.message}`);

      // In development, attempt Ethereal test mail fallback
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log(`🔄 [SMTP_DEV_FALLBACK] [${reqId}] Attempting Ethereal test mail fallback...`);
          if (!fallbackTransporter) {
            const testAccount = await nodemailer.createTestAccount();
            fallbackTransporter = nodemailer.createTransport({
              host: 'smtp.ethereal.email',
              port: 587,
              secure: false,
              family: 4,
              auth: {
                user: testAccount.user,
                pass: testAccount.pass,
              },
            });
          }

          const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
          const previewUrl = nodemailer.getTestMessageUrl(fallbackInfo);
          console.log(`✅ [DEV TEST EMAIL SENT] Delivered via Ethereal Mail to ${maskEmail(to)}`);
          console.log(`🔗 [VIEW EMAIL PREVIEW IN BROWSER]: ${previewUrl}`);
          return { success: true, messageId: fallbackInfo.messageId, previewUrl };
        } catch (fallbackErr) {
          console.error(`❌ [EMAIL_SEND_FAILED] [${reqId}] All transports failed: ${fallbackErr.message}`);
          throw new Error(`Email delivery failed: ${primaryErr.message}`);
        }
      } else {
        console.error(`❌ [EMAIL_SEND_FAILED] [${reqId}] Transports on ${configuredPort} & ${secondaryPort} failed`);
        throw new Error(`Email delivery failed: ${primaryErr.message}`);
      }
    }
  }
};

const sendOTPEmail = async (email, name, otp, type = 'verification', reqId = 'sys') => {
  const subjects = {
    verification: `🔒 Code: ${otp} — OTP Verification DevPhoenix Technologies LLP`,
    forgot: `🔑 Code: ${otp} — Password Reset DevPhoenix Technologies LLP`,
  };

  const titles = {
    verification: 'Email Verification OTP',
    forgot: 'Password Reset Verification',
  };

  const plainText = `Hi ${name},\n\nYour One-Time Password (OTP) for DevPhoenix Technologies LLP AI-Assessment Platform is: ${otp}\n\nThis OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes. Please do not share this code with anyone.\n\nRegards,\nDevPhoenix Technologies LLP Team`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DevPhoenix Technologies LLP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0f172a; padding: 40px 0; }
        .main { max-width: 540px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #d946ef 100%); padding: 36px 32px; text-align: center; }
        .header-title { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .header-subtitle { color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 600; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 36px 32px; color: #e2e8f0; }
        .greeting { font-size: 18px; font-weight: 600; color: #f8fafc; margin-top: 0; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0; }
        .otp-container { background: #0f172a; border: 2px dashed #6366f1; border-radius: 14px; padding: 24px; text-align: center; margin: 28px 0; }
        .otp-label { font-size: 12px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
        .otp-code { font-size: 38px; font-weight: 800; color: #38bdf8; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .otp-expiry { font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 500; }
        .warning-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #fca5a5; margin-top: 24px; }
        .footer { background-color: #0f172a; border-top: 1px solid #334155; padding: 24px 32px; text-align: center; }
        .footer-text { font-size: 12px; color: #64748b; margin: 4px 0; }
        .company-name { font-weight: 700; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
          <div class="header">
            <h1 class="header-title">DevPhoenix Technologies LLP</h1>
            <div class="header-subtitle">AI-Assessment Examination System</div>
          </div>
          <div class="content">
            <h2 class="greeting">Hi ${name},</h2>
            <p class="text">You are completing authentication for the <strong>DevPhoenix AI-Assessment Platform</strong>. Use the One-Time Password (OTP) below to verify your account.</p>
            
            <div class="otp-container">
              <div class="otp-label">${titles[type]}</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱️ Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes</div>
            </div>

            <div class="warning-box">
              🔒 <strong>Security Warning:</strong> Never share this OTP code with anyone. DevPhoenix administrators will never ask for your verification code.
            </div>
          </div>
          <div class="footer">
            <p class="footer-text"><span class="company-name">DevPhoenix Technologies LLP</span></p>
            <p class="footer-text">Official AI-Assessment & Online Examination Platform</p>
            <p class="footer-text" style="margin-top:8px;">© ${new Date().getFullYear()} DevPhoenix Technologies LLP. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: subjects[type],
    text: plainText,
    html,
    reqId,
  });
};

module.exports = { sendEmail, sendOTPEmail };
