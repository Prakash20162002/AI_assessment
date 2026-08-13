const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const dns = require('dns');
const { independenceDayOtpTemplate, PUBLIC_LOGO_URL } = require('../utils/emailTemplates');

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
 * Premium Email Template Generator (Inspired by modern WorkAngel/Stripe aesthetic)
 */
const generatePremiumEmailHtml = ({ name, titleText, mainHeading, bodyText, otpCode, expireMinutes, type = 'verification' }) => {
  const clientUrl = process.env.CLIENT_URL || 'https://ai-assessment-beta.vercel.app/';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DevPhoeniX Technologies</title>
      <style>
        body { margin: 0; padding: 0; background-color: #eff4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .email-outer { width: 100%; table-layout: fixed; background-color: #eff4f8; padding: 40px 16px; }
        .email-card-container { max-width: 560px; margin: 0 auto; }
        
        /* Header Section */
        .brand-logo-badge { width: 56px; height: 56px; margin: 0 auto 20px auto; background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%); border-radius: 50%; text-align: center; line-height: 56px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
        .brand-logo-badge img { width: 28px; height: 28px; vertical-align: middle; margin-top: 14px; }
        .header-greeting { font-size: 26px; font-weight: 300; color: #1e293b; text-align: center; margin: 0 0 28px 0; line-height: 1.35; letter-spacing: -0.4px; }
        .header-greeting strong { font-weight: 700; color: #0f172a; }

        /* Card 1: Main Action Card */
        .card-box { background-color: #ffffff; border-radius: 16px; padding: 36px 32px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03); border: 1px solid rgba(226, 232, 240, 0.8); }
        .illustration-icon { width: 72px; height: 72px; margin: 0 auto 20px auto; display: block; }
        .card-text { font-size: 14px; line-height: 1.6; color: #475569; text-align: center; margin: 0 0 24px 0; }
        
        /* OTP Code Box */
        .otp-display-box { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px 16px; text-align: center; margin: 24px 0; }
        .otp-subtitle { font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        .otp-number { font-size: 38px; font-weight: 800; color: #0f172a; letter-spacing: 12px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; margin: 0; text-indent: 12px; }
        .otp-expiry-tag { display: inline-block; background-color: rgba(2, 132, 199, 0.1); color: #0284c7; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 10px; }

        /* Button CTA */
        .btn-action { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-align: center; margin-top: 8px; }
        
        /* Card 2: Feature / App Card */
        .app-card-title { font-size: 18px; font-weight: 600; color: #1e293b; text-align: center; margin: 0 0 10px 0; }
        .app-card-sub { font-size: 13px; color: #64748b; text-align: center; line-height: 1.5; margin: 0 0 20px 0; }
        .app-badges-container { text-align: center; margin-top: 16px; }
        .badge-btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 600; margin: 4px 6px; letter-spacing: 0.3px; }

        /* Security Alert Box */
        .security-note { background-color: #fff1f2; border-left: 4px solid #f43f5e; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #9f1239; line-height: 1.5; margin-top: 24px; text-align: left; }

        /* Footer */
        .social-links { text-align: center; margin-bottom: 20px; }
        .social-icon { display: inline-block; width: 36px; height: 36px; line-height: 36px; border-radius: 50%; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 700; text-decoration: none; margin: 0 6px; text-align: center; }
        .footer-brand { font-size: 20px; font-weight: 700; color: #64748b; text-align: center; font-style: italic; font-family: Georgia, serif; margin-bottom: 12px; }
        .footer-text { font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6; margin: 2px 0; }
      </style>
    </head>
    <body>
      <div class="email-outer">
        <div class="email-card-container">
          
          <!-- Top Logo -->
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies LLP" width="200" style="max-height: 48px; max-width: 200px; width: 200px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
          </div>

          <!-- Greeting Headline -->
          <h1 class="header-greeting">
            Hi <strong>${name}</strong>,<br>
            ${mainHeading}
          </h1>

          <!-- Card 1: Main Action Card -->
          <div class="card-box" style="text-align: center;">
            <!-- Envelope / Shield Illustration Icon -->
            <svg class="illustration-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="72" height="72" rx="36" fill="#F0F9FF"/>
              <path d="M20 26C20 23.7909 21.7909 22 24 22H48C50.2091 22 52 23.7909 52 26V46C52 48.2091 50.2091 50 48 50H24C21.7909 50 20 48.2091 20 46V26Z" fill="#FFFFFF" stroke="#64748B" stroke-width="2.5"/>
              <path d="M22 24L36 36L50 24" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="36" cy="38" r="10" fill="#22C55E"/>
              <path d="M32 38L35 41L40 35" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>

            <p class="card-text">${bodyText}</p>

            <!-- OTP Display Card -->
            <div class="otp-display-box">
              <div class="otp-subtitle">${titleText}</div>
              <div class="otp-number">${otpCode}</div>
              <div class="otp-expiry-tag">⏱️ Valid for ${expireMinutes} minutes</div>
            </div>

            <!-- Call to Action Button -->
            <a href="${clientUrl}" class="btn-action" target="_blank">Access DevPhoeniX Portal</a>

            <!-- Security Warning -->
            <div class="security-note">
              🔒 <strong>Security Note:</strong> Never share this verification code with anyone. DevPhoeniX administrators will never ask for your verification code. If you did not initiate this request, you can safely ignore this email.
            </div>
          </div>

          <!-- Footer Section -->
          <div style="margin-top: 32px; text-align: center;">
            <div class="footer-brand">DevPhoeniX Technologies LLP</div>
            <p class="footer-text">Official AI-Assessment & Online Examination Platform</p>
            <p class="footer-text">© ${new Date().getFullYear()} DevPhoeniX Technologies LLP. All rights reserved.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send OTP Verification / Password Reset Email
 */
const sendOTPEmail = async (email, name, otp, type = 'verification', reqId = 'sys') => {
  const expireMinutes = process.env.OTP_EXPIRE_MINUTES || 10;

  const subjects = {
    verification: `Verify your email — DevPhoeniX Assessment (Code: ${otp})`,
    forgot: `Reset your password — DevPhoeniX Assessment (Code: ${otp})`,
  };

  const headings = {
    verification: `your DevPhoeniX account verification code is ready!`,
    forgot: `your DevPhoeniX password reset request is ready!`,
  };

  const titles = {
    verification: 'Email Verification Code',
    forgot: 'Password Reset Verification',
  };

  const bodyTexts = {
    verification: `Your DevPhoeniX account has been created. Use the verification code below to log in to the assessment portal and complete your account setup.`,
    forgot: `We received a password reset request for your DevPhoeniX account. Use the verification code below to authorize your password reset.`,
  };

  const plainText = `Hi ${name},\n\nYour One-Time Password (OTP) verification code for DevPhoeniX Technologies AI-Assessment Platform is: ${otp}\n\nThis code expires in ${expireMinutes} minutes. If you did not create this account, you can safely ignore this email.\n\nRegards,\nDevPhoeniX Technologies Team`;

  const html = independenceDayOtpTemplate({
    name: name || 'User',
    otp,
    expireMinutes,
    type,
  });

  return sendEmail({
    to: email,
    subject: subjects[type],
    text: plainText,
    html,
    reqId,
  });
};

module.exports = { sendEmail, sendOTPEmail, generatePremiumEmailHtml };
