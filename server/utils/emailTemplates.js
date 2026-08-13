/**
 * DevPhoeniX Premium Email Templates Collection
 * Inspired by modern, high-end SaaS designs (WorkAngel, Stripe, Resend)
 */

const PUBLIC_LOGO_URL = 'https://ai-assessment-beta.vercel.app/logo.png';
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
        .brand-logo-wrap { text-align: center; margin: 0 auto 20px auto; }
        .brand-logo-wrap img { max-height: 48px; max-width: 200px; width: auto; height: auto; display: block; margin: 0 auto; border: 0; outline: none; }
        
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
          <div class="brand-logo-wrap">
            <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies LLP" style="max-height: 48px; max-width: 200px; width: auto; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
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
 * DevPhoeniX Independence Day Festive Edition OTP Email Template
 */
const independenceDayOtpTemplate = ({
  name = 'User',
  otp = '831956',
  expireMinutes = 10,
  type = 'verification',
  dateString = '15 AUGUST 2026',
}) => {
  const clientUrl = getClientUrl();
  const year = new Date().getFullYear();

  // Custom heading & text based on type
  const isForgot = type === 'forgot';
  const headingText = isForgot ? 'Reset your password' : 'Verify your email address';
  const subtitleText = isForgot
    ? 'We received a password reset request for your DevPhoeniX account. Use the secure verification code below to authorize your password reset.'
    : 'Welcome to DevPhoenix Assessment. Use the secure verification code below to complete your registration and access your assessment.';
  const codeLabel = isForgot ? 'PASSWORD RESET VERIFICATION CODE' : 'EMAIL VERIFICATION CODE';
  const ctaText = isForgot ? '🔒 Reset DevPhoeniX Password' : '🔒 Access DevPhoeniX Assessment';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPhoeniX OTP Verification</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { padding: 0; }
    img { border: 0; height: auto; outline: none; text-decoration: none; display: block; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; border-radius: 0 !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .otp-number { font-size: 32px !important; letter-spacing: 10px !important; text-indent: 10px !important; }
      .header-logo-img { max-width: 200px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 40px 0; background-color: #0f172a;">
  <center style="width: 100%; table-layout: fixed; background-color: #0f172a;">
    <div class="email-container" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.35);">
      
      <!-- ================= HEADER SECTION ================= -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0B132B; padding: 22px 28px;">
        <tr>
          <!-- Official DevPhoeniX Transparent Logo -->
          <td align="left" valign="middle">
            <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies LLP" class="header-logo-img" style="max-height: 48px; max-width: 220px; width: auto; height: auto; display: block; border: 0; outline: none; text-decoration: none; object-fit: contain;">
          </td>

          <!-- India Flag Edition Pill Badge -->
          <td align="right" valign="middle">
            <table cellpadding="0" cellspacing="0" border="0" style="background-color: #06182E; border: 1px solid #1E3A8A; border-radius: 8px; padding: 6px 14px;">
              <tr>
                <td valign="middle" style="padding-right: 10px;">
                  <span style="font-size: 20px; line-height: 1;">🇮🇳</span>
                </td>
                <td valign="middle" align="left">
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; line-height: 1.2;">${dateString}</div>
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; font-weight: 700; color: #22C55E; letter-spacing: 0.5px; line-height: 1.2;">INDEPENDENCE DAY EDITION</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- ================= TOP HERO BANNER ================= -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%); position: relative; border-bottom: 1px solid #F1F5F9;">
        <tr>
          <td colspan="3" style="line-height: 0; font-size: 0; background-color: #0B132B;">
            <svg width="100%" height="24" viewBox="0 0 600 24" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0C150 20 450 20 600 0V24H0V0Z" fill="#FAF8F5"/>
              <path d="M0 0C150 14 450 14 600 0" stroke="#FF9933" stroke-width="3" fill="none"/>
            </svg>
          </td>
        </tr>
        <tr>
          <td width="22%" align="center" valign="middle" style="padding: 10px 0 10px 12px;">
            <div style="position: relative; width: 100px; height: 100px;">
              <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20C40 5 80 15 105 35C115 45 100 85 70 95C40 105 10 90 5 65C0 40 5 25 10 20Z" fill="url(#saffron_grad_ep)" opacity="0.35"/>
                <path d="M20 40C50 25 90 35 110 55C115 65 95 100 65 105C35 110 15 95 10 75C5 55 10 45 20 40Z" fill="url(#green_grad_ep)" opacity="0.25"/>
                <circle cx="50" cy="50" r="26" fill="#FFFFFF"/>
                <circle cx="50" cy="50" r="23" stroke="#000080" stroke-width="1.5" fill="none"/>
                <circle cx="50" cy="50" r="4" fill="#000080"/>
                <g stroke="#000080" stroke-width="1">
                  <line x1="50" y1="27" x2="50" y2="73"/><line x1="27" y1="50" x2="73" y2="50"/>
                  <line x1="34" y1="34" x2="66" y2="66"/><line x1="34" y1="66" x2="66" y2="34"/>
                  <line x1="41" y1="29" x2="59" y2="71"/><line x1="41" y1="71" x2="59" y2="29"/>
                  <line x1="29" y1="41" x2="71" y2="59"/><line x1="29" y1="59" x2="71" y2="41"/>
                </g>
                <defs>
                  <linearGradient id="saffron_grad_ep" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FF9933"/>
                    <stop offset="100%" stop-color="#FF6600"/>
                  </linearGradient>
                  <linearGradient id="green_grad_ep" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#138808"/>
                    <stop offset="100%" stop-color="#006600"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </td>
          <td width="56%" align="center" valign="middle" style="padding: 20px 8px;">
            <div style="font-family: 'Brush Script MT', 'Playfair Display', Georgia, cursive, serif; font-size: 32px; font-style: italic; color: #D97706; line-height: 1.1; margin-bottom: 2px;">Happy</div>
            <div style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 800; color: #0B132B; letter-spacing: 0.5px; line-height: 1.2;">Independence Day</div>
            
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 12px auto 10px auto;">
              <tr>
                <td valign="middle" width="55"><div style="height: 2px; background: linear-gradient(90deg, rgba(255,153,51,0) 0%, #FF9933 100%);"></div></td>
                <td valign="middle" style="padding: 0 8px;">
                  <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="46" stroke="#000080" stroke-width="6" fill="#FFFFFF"/>
                    <circle cx="50" cy="50" r="8" fill="#000080"/>
                    <g stroke="#000080" stroke-width="3">
                      <line x1="50" y1="4" x2="50" y2="96"/><line x1="4" y1="50" x2="96" y2="50"/>
                      <line x1="17" y1="17" x2="83" y2="83"/><line x1="17" y1="83" x2="83" y2="17"/>
                      <line x1="30" y1="8" x2="70" y2="92"/><line x1="30" y1="92" x2="70" y2="8"/>
                      <line x1="8" y1="30" x2="92" y2="70"/><line x1="8" y1="70" x2="92" y2="30"/>
                    </g>
                  </svg>
                </td>
                <td valign="middle" width="55"><div style="height: 2px; background: linear-gradient(90deg, #138808 0%, rgba(19,136,8,0) 100%);"></div></td>
              </tr>
            </table>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #475569; line-height: 1.5; font-weight: 500;">
              Celebrating the spirit of freedom,<br>innovation & progress.
            </div>
          </td>
          <td width="22%" align="right" valign="bottom" style="padding: 0 12px 6px 0;">
            <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 25C23 23 26 25 28 27C30 25 33 23 36 25" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" fill="none"/>
              <path d="M45 15C47 13 49 15 51 16C53 15 55 13 57 15" stroke="#64748B" stroke-width="1.2" stroke-linecap="round" fill="none"/>
              <g fill="#D4C5B0">
                <rect x="30" y="102" width="60" height="6" rx="1"/>
                <rect x="34" y="96" width="52" height="6" rx="1"/>
                <rect x="38" y="55" width="12" height="41"/>
                <rect x="70" y="55" width="12" height="41"/>
                <path d="M50 55C50 47 70 47 70 55H50Z"/>
                <rect x="34" y="42" width="52" height="13" rx="1"/>
                <rect x="30" y="36" width="60" height="6" rx="1"/>
                <rect x="42" y="28" width="36" height="8" rx="1"/>
                <rect x="46" y="24" width="28" height="4" rx="1"/>
              </g>
              <g fill="#C5B39C">
                <path d="M50 96V65C50 57 70 57 70 65V96H64V65C64 61 56 61 56 65V96H50Z"/>
                <rect x="34" y="48" width="52" height="3"/>
              </g>
            </svg>
          </td>
        </tr>
      </table>

      <!-- ================= EMAIL CONTENT AREA ================= -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 36px 36px 20px 36px;" class="mobile-padding">
        <tr>
          <td>
            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #1E293B; margin-bottom: 14px;">
              Hi <strong style="color: #0F172A; font-weight: 700;">${name}</strong>,
            </div>

            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #0F172A; margin-bottom: 12px; letter-spacing: -0.3px;">
              ${headingText}
            </div>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
              ${subtitleText}
            </div>

            <!-- ================= OTP CARD CONTAINER ================= -->
            <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); margin-bottom: 30px; position: relative;">
              <div style="height: 5px; background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%);"></div>

              <div style="padding: 32px 24px; text-align: center; position: relative;">
                <div style="position: absolute; top: 50%; left: 82%; transform: translate(-50%, -50%); opacity: 0.05; pointer-events: none;">
                  <svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="46" stroke="#000080" stroke-width="5"/>
                    <circle cx="50" cy="50" r="8" fill="#000080"/>
                    <g stroke="#000080" stroke-width="2.5">
                      <line x1="50" y1="4" x2="50" y2="96"/><line x1="4" y1="50" x2="96" y2="50"/>
                      <line x1="17" y1="17" x2="83" y2="83"/><line x1="17" y1="83" x2="83" y2="17"/>
                      <line x1="30" y1="8" x2="70" y2="92"/><line x1="30" y1="92" x2="70" y2="8"/>
                      <line x1="8" y1="30" x2="92" y2="70"/><line x1="8" y1="70" x2="92" y2="30"/>
                    </g>
                  </svg>
                </div>

                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 14px;">
                  ${codeLabel}
                </div>

                <div class="otp-number" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 42px; font-weight: 900; color: #0F172A; letter-spacing: 16px; text-indent: 16px; margin: 16px 0;">
                  ${otp}
                </div>

                <div style="display: inline-block; background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 20px; padding: 6px 18px; margin-top: 8px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" style="padding-right: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </td>
                      <td valign="middle" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #0284C7;">
                        Valid for ${expireMinutes} minutes
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              <div style="padding: 0 24px 32px 24px; text-align: center;">
                <a href="${clientUrl}" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #EA580C 0%, #16A34A 100%); color: #FFFFFF; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 6px 18px rgba(22, 163, 74, 0.35); text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                  ${ctaText}
                </a>
              </div>
            </div>

            <!-- ================= SECURITY REMINDER ================= -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 14px; padding: 18px 22px; margin-bottom: 30px;">
              <tr>
                <td width="42" valign="middle" style="padding-right: 14px;">
                  <svg width="38" height="38" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" rx="24" fill="#22C55E"/>
                    <path d="M24 12L14 17V24C14 31 18.5 37.5 24 40C29.5 37.5 34 31 34 24V17L24 12Z" fill="#22C55E" stroke="#FFFFFF" stroke-width="2.5"/>
                    <path d="M20 24L23 27L28 21" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </td>
                <td valign="middle">
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 3px;">
                    Security reminder
                  </div>
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.5px; line-height: 1.5; color: #15803D;">
                    Never share this verification code with anyone. DevPhoeniX will never ask you to disclose your OTP. If you did not request this code, you can safely ignore this email.
                  </div>
                </td>
              </tr>
            </table>

            <!-- ================= BOTTOM FESTIVE BANNER ================= -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1px solid #FDE68A; border-radius: 16px; padding: 22px 22px; margin-bottom: 10px;">
              <tr>
                <td width="55" valign="middle" align="center">
                  <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="46" stroke="#000080" stroke-width="5" fill="#FFFFFF"/>
                    <circle cx="50" cy="50" r="8" fill="#000080"/>
                    <g stroke="#000080" stroke-width="2.5">
                      <line x1="50" y1="4" x2="50" y2="96"/><line x1="4" y1="50" x2="96" y2="50"/>
                      <line x1="17" y1="17" x2="83" y2="83"/><line x1="17" y1="83" x2="83" y2="17"/>
                      <line x1="30" y1="8" x2="70" y2="92"/><line x1="30" y1="92" x2="70" y2="8"/>
                      <line x1="8" y1="30" x2="92" y2="70"/><line x1="8" y1="70" x2="92" y2="30"/>
                    </g>
                  </svg>
                </td>
                <td valign="middle" align="center" style="padding: 0 14px;">
                  <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-weight: 700; color: #1E293B; line-height: 1.45; margin-bottom: 8px;">
                    On this Independence Day,<br>we celebrate the freedom to learn, build and innovate.
                  </div>
                  <div style="width: 80px; height: 2px; background: linear-gradient(90deg, #FF9933 0%, #138808 100%); margin: 6px auto;"></div>
                  <div style="font-family: 'Brush Script MT', 'Playfair Display', Georgia, cursive, serif; font-size: 24px; font-style: italic; color: #C2410C; margin-top: 4px;">
                    Jai Hind <span style="font-style: normal; font-size: 16px;">🇮🇳</span>
                  </div>
                </td>
                <td width="70" valign="middle" align="right">
                  <svg width="70" height="65" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 90L40 50L70 70L100 90H0Z" fill="#D97706" opacity="0.25"/>
                    <path d="M20 90L60 30L100 90H20Z" fill="#78350F" opacity="0.4"/>
                    <line x1="60" y1="30" x2="60" y2="2" stroke="#78350F" stroke-width="2"/>
                    <path d="M60 2L85 8L60 16V2Z" fill="#FF9933"/>
                    <path d="M60 7L85 11L60 14V7Z" fill="#FFFFFF"/>
                    <path d="M60 12L85 14L60 16V12Z" fill="#138808"/>
                    <circle cx="54" cy="40" r="3" fill="#451A03"/>
                    <path d="M54 43L50 60L56 52" stroke="#451A03" stroke-width="2.5"/>
                    <circle cx="46" cy="45" r="3" fill="#451A03"/>
                    <path d="M46 48L40 65L48 55" stroke="#451A03" stroke-width="2.5"/>
                    <circle cx="64" cy="38" r="3" fill="#451A03"/>
                    <path d="M64 41L70 58L62 50" stroke="#451A03" stroke-width="2.5"/>
                  </svg>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

      <!-- ================= DARK FOOTER SECTION ================= -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0B132B; padding: 36px 28px; text-align: center;">
        <tr>
          <td align="center">
            <div style="margin-bottom: 16px; text-align: center;">
              <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies LLP" style="max-height: 48px; max-width: 220px; width: auto; height: auto; margin: 0 auto; display: block; border: 0; outline: none; text-decoration: none; object-fit: contain;">
            </div>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #94A3B8; margin-bottom: 22px;">
              Official AI-Powered Assessment & Online Examination Platform
            </div>

            <div style="width: 80%; max-width: 400px; height: 1px; background-color: #1E293B; margin: 0 auto 22px auto;"></div>

            <div style="margin-bottom: 22px;">
              <a href="${clientUrl}" target="_blank" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; border-radius: 50%; background-color: #1E293B; border: 1px solid #334155; color: #FFFFFF; font-size: 14px; text-decoration: none; margin: 0 5px; text-align: center;">🌐</a>
              <a href="https://facebook.com" target="_blank" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; border-radius: 50%; background-color: #1E293B; border: 1px solid #334155; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; margin: 0 5px; text-align: center;">f</a>
              <a href="https://linkedin.com" target="_blank" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; border-radius: 50%; background-color: #1E293B; border: 1px solid #334155; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; margin: 0 5px; text-align: center;">in</a>
              <a href="https://instagram.com" target="_blank" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; border-radius: 50%; background-color: #1E293B; border: 1px solid #334155; color: #FFFFFF; font-size: 14px; text-decoration: none; margin: 0 5px; text-align: center;">📷</a>
            </div>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #64748B; line-height: 1.5;">
              © ${year} DevPhoeniX Technologies LLP. All rights reserved.
            </div>
          </td>
        </tr>
      </table>

    </div>
  </center>
</body>
</html>`;
};

const otpVerificationTemplate = ({ name, otp, expireMinutes = 10 }) => {
  return independenceDayOtpTemplate({ name, otp, expireMinutes, type: 'verification' });
};

module.exports = {
  renderBaseLayout,
  accountApprovedTemplate,
  otpVerificationTemplate,
  independenceDayOtpTemplate,
};
