const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"ExamPlatform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

const sendOTPEmail = async (email, name, otp, type = 'verification') => {
  const subjects = {
    verification: 'Verify Your Email — ExamPlatform',
    forgot: 'Password Reset OTP — ExamPlatform',
  };

  const titles = {
    verification: 'Email Verification',
    forgot: 'Password Reset',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
        .body { padding: 40px 32px; }
        .otp-box { background: #f8f7ff; border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp { font-size: 40px; font-weight: 700; color: #6366f1; letter-spacing: 12px; }
        .note { color: #64748b; font-size: 14px; margin-top: 8px; }
        .footer { background: #f8f7ff; padding: 20px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 ExamPlatform</h1>
        </div>
        <div class="body">
          <h2 style="color:#1e293b;margin-top:0;">${titles[type]}</h2>
          <p style="color:#475569;">Hi <strong>${name}</strong>,</p>
          <p style="color:#475569;">Your one-time password (OTP) is:</p>
          <div class="otp-box">
            <div class="otp">${otp}</div>
            <div class="note">Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes</div>
          </div>
          <p style="color:#475569;">If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">© ${new Date().getFullYear()} ExamPlatform. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject: subjects[type], html });
};

module.exports = { sendEmail, sendOTPEmail };
