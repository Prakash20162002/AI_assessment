const nodemailer = require('nodemailer');

// Singleton cached transporters
const transporters = new Map();

const getTransporter = (portOverride = null) => {
  const configuredPort = parseInt(process.env.EMAIL_PORT || '465', 10);
  const port = portOverride || configuredPort;
  const key = `smtp_${port}`;

  if (!transporters.has(key)) {
    const isSecure = port === 465;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port,
      secure: isSecure,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
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

const sendEmail = async ({ to, subject, text, html }) => {
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

  const configuredPort = parseInt(process.env.EMAIL_PORT || '465', 10);
  const primaryTransporter = getTransporter(configuredPort);

  try {
    const info = await primaryTransporter.sendMail(mailOptions);
    console.log(`📧 [EMAIL DELIVERED] Primary Port ${configuredPort} -> ${maskEmail(to)} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (primaryErr) {
    console.error(`⚠️ [Primary SMTP Port ${configuredPort} failed]: ${primaryErr.message}`);

    // Try secondary port failover (587 if primary was 465, or 465 if primary was 587)
    const secondaryPort = configuredPort === 465 ? 587 : 465;
    try {
      console.log(`🔄 Attempting Port ${secondaryPort} failover...`);
      const secondaryTransporter = getTransporter(secondaryPort);
      const secondaryInfo = await secondaryTransporter.sendMail(mailOptions);
      console.log(`📧 [EMAIL DELIVERED] Failover Port ${secondaryPort} -> ${maskEmail(to)} (ID: ${secondaryInfo.messageId})`);
      return { success: true, messageId: secondaryInfo.messageId };
    } catch (secondaryErr) {
      console.error(`⚠️ [Failover SMTP Port ${secondaryPort} failed]: ${secondaryErr.message}`);

      // In development, attempt Ethereal test mail fallback
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log(`🔄 Attempting Ethereal test mail fallback...`);
          if (!fallbackTransporter) {
            const testAccount = await nodemailer.createTestAccount();
            fallbackTransporter = nodemailer.createTransport({
              host: 'smtp.ethereal.email',
              port: 587,
              secure: false,
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
          console.error(`❌ [ALL EMAIL TRANSPORTS FAILED]: ${fallbackErr.message}`);
          throw new Error(`Email delivery failed: ${primaryErr.message}`);
        }
      } else {
        throw new Error(`Email delivery failed: ${primaryErr.message}`);
      }
    }
  }
};

const sendOTPEmail = async (email, name, otp, type = 'verification') => {
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
  });
};

module.exports = { sendEmail, sendOTPEmail };
