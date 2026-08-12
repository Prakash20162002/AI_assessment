/**
 * DevPhoeniX Premium Email Templates Collection
 * Inspired by modern, high-end SaaS designs (WorkAngel, Stripe, Resend)
 */

const getClientUrl = () => process.env.CLIENT_URL || 'https://ai-assessment-beta.vercel.app/';

/**
 * Base Wrapper Layout for all DevPhoeniX emails
 */
const renderBaseLayout = ({ name, mainHeading, contentHtml }) => {
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
        
        /* Top Badge */
        .brand-logo-badge { width: 56px; height: 56px; margin: 0 auto 20px auto; background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%); border-radius: 50%; text-align: center; line-height: 56px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
        .brand-logo-badge span { color: #ffffff; font-size: 26px; font-weight: 900; }
        
        /* Main Heading */
        .header-greeting { font-size: 26px; font-weight: 300; color: #1e293b; text-align: center; margin: 0 0 28px 0; line-height: 1.35; letter-spacing: -0.4px; }
        .header-greeting strong { font-weight: 700; color: #0f172a; }

        /* Card Elements */
        .card-box { background-color: #ffffff; border-radius: 16px; padding: 36px 32px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03); border: 1px solid rgba(226, 232, 240, 0.8); text-align: center; }
        .illustration-icon { width: 72px; height: 72px; margin: 0 auto 20px auto; display: block; }
        .card-text { font-size: 14px; line-height: 1.6; color: #475569; text-align: center; margin: 0 0 24px 0; }
        
        /* OTP Box */
        .otp-display-box { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px 16px; text-align: center; margin: 24px 0; }
        .otp-subtitle { font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        .otp-number { font-size: 38px; font-weight: 800; color: #0f172a; letter-spacing: 12px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; margin: 0; text-indent: 12px; }
        .otp-expiry-tag { display: inline-block; background-color: rgba(2, 132, 199, 0.1); color: #0284c7; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 10px; }

        /* Button CTA */
        .btn-action { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-align: center; margin-top: 8px; }

        /* App Promo Card */
        .app-card-title { font-size: 18px; font-weight: 600; color: #1e293b; text-align: center; margin: 0 0 10px 0; }
        .app-card-sub { font-size: 13px; color: #64748b; text-align: center; line-height: 1.5; margin: 0 0 20px 0; }
        .app-badges-container { text-align: center; margin-top: 16px; }
        .badge-btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 600; margin: 4px 6px; letter-spacing: 0.3px; }

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
          
          <!-- Top Logo Badge -->
          <div class="brand-logo-badge">
            <span>W</span>
          </div>

          <!-- Greeting Headline -->
          <h1 class="header-greeting">
            Hi <strong>${name}</strong>,<br>
            ${mainHeading}
          </h1>

          ${contentHtml}

          <!-- App Card -->
          <div class="card-box">
            <h2 class="app-card-title">Get the DevPhoeniX App!</h2>
            <p class="app-card-sub">Get the most of DevPhoeniX by installing the mobile app. You can log in using your existing email address and password.</p>
            
            <div class="app-badges-container">
              <a href="${getClientUrl()}" class="badge-btn" target="_blank">🌐 Web Portal</a>
              <a href="${getClientUrl()}" class="badge-btn" target="_blank">📱 App Store</a>
              <a href="${getClientUrl()}" class="badge-btn" target="_blank">🤖 Google Play</a>
            </div>
          </div>

          <!-- Footer Section -->
          <div class="social-links">
            <a href="https://facebook.com" class="social-icon" target="_blank">f</a>
            <a href="https://twitter.com" class="social-icon" target="_blank">t</a>
            <a href="https://linkedin.com" class="social-icon" target="_blank">in</a>
          </div>

          <div class="footer-brand">devphoenix</div>

          <p class="footer-text">Copyright © ${new Date().getFullYear()}, DevPhoeniX Reward & Recognition.</p>
          <p class="footer-text">A better company begins with a personalized employee experience.</p>

        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template 1: Account Approval / Welcome Email
 */
const accountApprovedTemplate = ({ name, networkName = 'Luna network' }) => {
  const contentHtml = `
    <div class="card-box">
      <!-- Green Check Envelope Icon -->
      <svg class="illustration-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="36" fill="#F0F9FF"/>
        <path d="M20 26C20 23.7909 21.7909 22 24 22H48C50.2091 22 52 23.7909 52 26V46C52 48.2091 50.2091 50 48 50H24C21.7909 50 20 48.2091 20 46V26Z" fill="#FFFFFF" stroke="#64748B" stroke-width="2.5"/>
        <path d="M22 24L36 36L50 24" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="36" cy="38" r="10" fill="#22C55E"/>
        <path d="M32 38L35 41L40 35" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <p class="card-text">
        Your DevPhoeniX account has been approved and you can now log in to the ${networkName}.
      </p>

      <p class="card-text" style="color: #64748b; font-size: 13px;">
        You can access DevPhoeniX online or on any device by going to <br>
        <a href="${getClientUrl()}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${getClientUrl()}</a>
      </p>

      <a href="${getClientUrl()}" class="btn-action" target="_blank">Get started</a>
    </div>
  `;

  return renderBaseLayout({
    name,
    mainHeading: 'your DevPhoeniX account has been approved!',
    contentHtml,
  });
};

/**
 * Template 2: Email Verification OTP Email
 */
const otpVerificationTemplate = ({ name, otp, expireMinutes = 10 }) => {
  const contentHtml = `
    <div class="card-box">
      <!-- Shield Verification Icon -->
      <svg class="illustration-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="36" fill="#EFF6FF"/>
        <path d="M36 20L22 26V36C22 45 28 53 36 56C44 53 50 45 50 36V26L36 20Z" fill="#FFFFFF" stroke="#2563EB" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M30 36L34 40L42 32" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <p class="card-text">
        Your DevPhoeniX account setup is almost complete. Use the One-Time Password (OTP) verification code below to authorize your account.
      </p>

      <div class="otp-display-box">
        <div class="otp-subtitle">Email Verification Code</div>
        <div class="otp-number">${otp}</div>
        <div class="otp-expiry-tag">⏱️ Valid for ${expireMinutes} minutes</div>
      </div>

      <a href="${getClientUrl()}" class="btn-action" target="_blank">Verify Account</a>
    </div>
  `;

  return renderBaseLayout({
    name,
    mainHeading: 'your verification code is ready!',
    contentHtml,
  });
};

module.exports = {
  renderBaseLayout,
  accountApprovedTemplate,
  otpVerificationTemplate,
};
