const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const dns = require('dns');

// Custom DNS lookup forcing IPv4 resolution for local dev fallback
const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { ...options, family: 4, hints: dns.ADDRCONFIG }, callback);
};

// Resend SDK Singleton
let resendClient = null;
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

// Singleton cached SMTP transporter for local development only
let localSmtpTransporter = null;
const getLocalSmtpTransporter = () => {
  if (!localSmtpTransporter) {
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    localSmtpTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      requireTLS: port === 587,
      lookup: ipv4Lookup,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 3000,
      socketTimeout: 3000,
    });
  }
  return localSmtpTransporter;
};

let etherealTransporter = null;

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
};

/**
 * Send Email via Resend HTTPS API (Production Default) or Local SMTP Fallback
 */
const sendEmail = async ({ to, subject, text, html, reqId = 'sys' }) => {
  console.log(`📧 [EMAIL_SEND_STARTED] [${reqId}] Recipient: ${maskEmail(to)}`);
  const startTime = Date.now();

  const providerSetting = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  const resendApiKey = process.env.RESEND_API_KEY;

  // --- PRODUCTION PATH: RESEND HTTPS API ---
  if (providerSetting === 'resend' || resendApiKey || process.env.NODE_ENV === 'production') {
    console.log(`📡 [EMAIL_PROVIDER_REQUEST] [${reqId}] Provider: resend (Port 443 HTTPS)`);
    const resend = getResendClient();

    if (!resend && !resendApiKey) {
      const errMsg = 'RESEND_API_KEY is not configured in environment variables.';
      console.error(`❌ [EMAIL_PROVIDER_FAILURE] [${reqId}] Provider: resend | Error: ${errMsg}`);
      throw new Error(errMsg);
    }

    const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const fromName = process.env.EMAIL_FROM_NAME || 'DevPhoenix Technologies';
    const sender = `${fromName} <${fromAddress}>`;

    try {
      // Official Resend Node SDK Call with Idempotency Key header
      const { data, error } = await resend.emails.send(
        {
          from: sender,
          to: [to],
          subject,
          text,
          html,
        },
        {
          headers: {
            'Idempotency-Key': reqId,
          },
        }
      );

      if (error) {
        const errorDetails = error.message || JSON.stringify(error);
        console.error(`❌ [EMAIL_PROVIDER_FAILURE] [${reqId}] Provider: resend | Error: ${errorDetails}`);
        throw new Error(`Resend API Error: ${errorDetails}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [EMAIL_PROVIDER_SUCCESS] [${reqId}] Provider: resend Email ID: ${data.id} in ${duration}ms`);
      console.log(`🎉 [EMAIL_SEND_COMPLETED] [${reqId}] OTP delivered successfully via Resend HTTPS API`);
      return { success: true, messageId: data.id, provider: 'resend' };
    } catch (resendError) {
      console.error(`❌ [EMAIL_SEND_FAILED] [${reqId}] Provider: resend | ${resendError.message}`);
      throw new Error(resendError.message);
    }
  }

  // --- LOCAL DEVELOPMENT ONLY: OPTIONAL LOCAL SMTP ---
  console.log(`📡 [EMAIL_PROVIDER_REQUEST] [${reqId}] Provider: local_smtp (Development Only)`);
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'DevPhoenix Technologies'}" <${process.env.EMAIL_USER || 'no-reply@devphoenix.com'}>`,
      to,
      subject,
      text,
      html,
    };
    const transporter = getLocalSmtpTransporter();
    const info = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;
    console.log(`✅ [EMAIL_PROVIDER_SUCCESS] [${reqId}] Provider: local_smtp Email ID: ${info.messageId} in ${duration}ms`);
    console.log(`🎉 [EMAIL_SEND_COMPLETED] [${reqId}] Delivered via Local SMTP`);
    return { success: true, messageId: info.messageId, provider: 'local_smtp' };
  } catch (smtpErr) {
    console.error(`❌ [EMAIL_PROVIDER_FAILURE] [${reqId}] Local SMTP failed: ${smtpErr.message}`);

    // Dev Ethereal Mail preview fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log(`🔄 [SMTP_DEV_FALLBACK] [${reqId}] Attempting Ethereal test mail fallback...`);
        if (!etherealTransporter) {
          const testAccount = await nodemailer.createTestAccount();
          etherealTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
          });
        }
        const fallbackInfo = await etherealTransporter.sendMail({
          from: `"DevPhoenix Technologies" <no-reply@devphoenix.com>`,
          to,
          subject,
          text,
          html,
        });
        const previewUrl = nodemailer.getTestMessageUrl(fallbackInfo);
        console.log(`✅ [DEV TEST EMAIL SENT] Delivered via Ethereal Mail to ${maskEmail(to)}`);
        console.log(`🔗 [VIEW EMAIL PREVIEW IN BROWSER]: ${previewUrl}`);
        return { success: true, messageId: fallbackInfo.messageId, previewUrl, provider: 'ethereal_dev' };
      } catch (fallbackErr) {
        throw new Error(`Email delivery failed: ${smtpErr.message}`);
      }
    } else {
      throw new Error(`Email delivery failed: ${smtpErr.message}`);
    }
  }
};

/**
 * Send OTP Verification / Password Reset Email
 */
const sendOTPEmail = async (email, name, otp, type = 'verification', reqId = 'sys') => {
  const expireMinutes = process.env.OTP_EXPIRE_MINUTES || 10;
  const subjects = {
    verification: `Verify your email — DevPhoenix Assessment (Code: ${otp})`,
    forgot: `Reset your password — DevPhoenix Assessment (Code: ${otp})`,
  };

  const titles = {
    verification: 'Email Verification',
    forgot: 'Password Reset Verification',
  };

  const plainText = `Hi ${name},\n\nYour One-Time Password (OTP) verification code for DevPhoenix Technologies AI-Assessment Platform is: ${otp}\n\nThis code expires in ${expireMinutes} minutes. If you did not create this account, you can safely ignore this email.\n\nRegards,\nDevPhoenix Technologies Team`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DevPhoenix Technologies</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0f172a; padding: 40px 0; }
        .main { max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); padding: 32px; text-align: center; }
        .header-title { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; }
        .header-subtitle { color: rgba(255, 255, 255, 0.85); font-size: 12px; font-weight: 600; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 32px; color: #e2e8f0; }
        .greeting { font-size: 17px; font-weight: 600; color: #f8fafc; margin-top: 0; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
        .otp-container { background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; color: #38bdf8; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .otp-expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
        .warning-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; font-size: 12px; color: #fca5a5; margin-top: 20px; }
        .footer { background-color: #0f172a; border-top: 1px solid #334155; padding: 20px 32px; text-align: center; }
        .footer-text { font-size: 12px; color: #64748b; margin: 4px 0; }
        .company-name { font-weight: 700; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
          <div class="header">
            <h1 class="header-title">DevPhoenix Technologies</h1>
            <div class="header-subtitle">AI-Assessment Platform</div>
          </div>
          <div class="content">
            <h2 class="greeting">Hi ${name},</h2>
            <p class="text">Your verification code for the <strong>DevPhoenix AI-Assessment Platform</strong> is below. Enter this code to complete authentication.</p>
            
            <div class="otp-container">
              <div class="otp-label">${titles[type]}</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱️ Valid for ${expireMinutes} minutes</div>
            </div>

            <div class="warning-box">
              🔒 <strong>Security Warning:</strong> Never share this OTP code with anyone. DevPhoenix staff will never ask for your verification code. If you did not create this account, you can safely ignore this email.
            </div>
          </div>
          <div class="footer">
            <p class="footer-text"><span class="company-name">DevPhoenix Technologies</span></p>
            <p class="footer-text">Official AI-Assessment & Online Examination Platform</p>
            <p class="footer-text" style="margin-top:6px;">© ${new Date().getFullYear()} DevPhoenix Technologies. All rights reserved.</p>
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
