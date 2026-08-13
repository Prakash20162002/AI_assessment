/**
 * DevPhoeniX Premium Email Templates Collection
 * Production-ready transactional email templates
 */

const PUBLIC_LOGO_URL = 'https://ai-assessment-beta.vercel.app/logo.png';
const getClientUrl = () => process.env.CLIENT_URL || 'https://ai-assessment-beta.vercel.app/';

/**
 * Base Wrapper Layout for general DevPhoeniX emails
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
        body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .email-outer { width: 100%; table-layout: fixed; background-color: #0f172a; padding: 40px 16px; }
        .email-card-container { max-width: 600px; margin: 0 auto; }
        
        /* Top Logo Wrap */
        .brand-logo-wrap { text-align: center; margin: 0 auto 24px auto; }
        .brand-logo-wrap img { max-height: 48px; max-width: 200px; width: 200px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; }
        
        /* Main Heading */
        .header-greeting { font-size: 24px; font-weight: 300; color: #ffffff; text-align: center; margin: 0 0 24px 0; line-height: 1.35; letter-spacing: -0.4px; }
        .header-greeting strong { font-weight: 700; color: #ffffff; }

        /* Card Elements */
        .card-box { background-color: #ffffff; border-radius: 16px; padding: 36px 32px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); border: 1px solid #E6E8EC; text-align: center; }
        .illustration-icon { width: 64px; height: 64px; margin: 0 auto 20px auto; display: block; }
        .card-text { font-size: 14px; line-height: 1.6; color: #475569; text-align: center; margin: 0 0 24px 0; }
        
        /* OTP Box */
        .otp-display-box { background-color: #F8FAFC; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px 16px; text-align: center; margin: 24px 0; }
        .otp-subtitle { font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        .otp-number { font-size: 38px; font-weight: 800; color: #0f172a; letter-spacing: 12px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; margin: 0; text-indent: 12px; }
        .otp-expiry-tag { display: inline-block; background-color: rgba(2, 132, 199, 0.1); color: #0284c7; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 10px; }

        /* Button CTA */
        .btn-action { display: inline-block; background: linear-gradient(135deg, #E63946 0%, #F77F00 100%); color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(230, 57, 70, 0.25); text-align: center; margin-top: 8px; }

        /* Footer */
        .footer-brand { font-size: 16px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 6px; }
        .footer-text { font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6; margin: 2px 0; }
      </style>
    </head>
    <body>
      <div class="email-outer">
        <div class="email-card-container">
          
          <!-- Top Logo -->
          <div class="brand-logo-wrap">
            <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies LLP" width="200" style="max-height: 48px; max-width: 200px; width: 200px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
          </div>

          <!-- Greeting Headline -->
          <h1 class="header-greeting">
            Hi <strong>${name}</strong>,<br>
            ${mainHeading}
          </h1>

          ${contentHtml}

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
 * Account Approval / Welcome Email Template
 */
const accountApprovedTemplate = ({ name, networkName = 'DevPhoeniX Assessment' }) => {
  const contentHtml = `
    <div class="card-box">
      <!-- Green Check Envelope Icon -->
      <svg class="illustration-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="36" fill="#F0FDF4"/>
        <path d="M20 26C20 23.7909 21.7909 22 24 22H48C50.2091 22 52 23.7909 52 26V46C52 48.2091 50.2091 50 48 50H24C21.7909 50 20 48.2091 20 46V26Z" fill="#FFFFFF" stroke="#16A34A" stroke-width="2.5"/>
        <path d="M22 24L36 36L50 24" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="36" cy="38" r="10" fill="#22C55E"/>
        <path d="M32 38L35 41L40 35" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <p class="card-text">
        Your DevPhoeniX account has been verified and you can now log in to the assessment platform.
      </p>

      <p class="card-text" style="color: #64748b; font-size: 13px;">
        You can access DevPhoeniX online on any device by visiting: <br>
        <a href="${getClientUrl()}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${getClientUrl()}</a>
      </p>

      <a href="${getClientUrl()}" class="btn-action" target="_blank">Access Portal</a>
    </div>
  `;

  return renderBaseLayout({
    name,
    mainHeading: 'your DevPhoeniX account is verified!',
    contentHtml,
  });
};

/**
 * DevPhoeniX Independence Day Edition OTP Email Template
 * Exact match of user interface with top navy header, Ashok Chakra waves, India Gate,
 * dedicated OTP card, security reminder, bottom festive banner, and official footer.
 */
const independenceDayOtpTemplate = ({
  name = 'Student',
  otp = '831956',
  expireMinutes = 10,
  type = 'verification',
  dateString = '15 AUGUST 2026',
}) => {
  const clientUrl = getClientUrl();
  const year = new Date().getFullYear();

  const isForgot = type === 'forgot';
  const headingText = isForgot ? 'Reset your password' : 'Verify your email address';
  const subtitleText = isForgot
    ? 'We received a password reset request for your DevPhoeniX account. Use the secure verification code below to authorize your password reset.'
    : 'Welcome to <strong>DevPhoeniX Assessment Platform</strong>. Use the secure verification code below to complete your registration and access your assessment.';
  const codeLabel = isForgot ? 'PASSWORD RESET VERIFICATION CODE' : 'EMAIL VERIFICATION CODE';
  const ctaText = isForgot ? '🔒 Reset DevPhoeniX Password' : '🔒 Access DevPhoeniX Assessment';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPhoeniX OTP Verification - Independence Day Edition</title>
  <style>
    /* Reset & Base Styles */
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
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      display: block;
    }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
        border-radius: 0 !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .otp-number {
        font-size: 32px !important;
        letter-spacing: 10px !important;
        text-indent: 10px !important;
      }
      .header-logo-img {
        max-width: 180px !important;
      }
      .header-right-table {
        margin-top: 10px !important;
      }
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
            <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX" width="180" class="header-logo-img" style="max-height: 48px; width: 180px; height: auto; display: block; border: 0; outline: none;" />
          </td>

          <!-- Independence Day Badge on Right -->
          <td align="right" valign="middle">
            <table cellpadding="0" cellspacing="0" border="0" class="header-right-table" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 6px 14px;">
              <tr>
                <td valign="middle" style="padding-right: 8px;">
                  <!-- Flag Icon -->
                  <svg width="22" height="15" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="22" height="5" fill="#FF9933" rx="1"/>
                    <rect y="5" width="22" height="5" fill="#FFFFFF"/>
                    <rect y="10" width="22" height="5" fill="#138808" rx="1"/>
                    <circle cx="11" cy="7.5" r="2" fill="#000080"/>
                  </svg>
                </td>
                <td valign="middle" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5px; font-weight: 700; color: #FFFFFF; letter-spacing: 1px; text-transform: uppercase; line-height: 1.2;">
                  ${dateString}<br><span style="color: #6EE7B7; font-size: 9px;">INDEPENDENCE DAY EDITION</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- ================= HERO INDEPENDENCE DAY BANNER ================= -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%); padding: 32px 28px 24px 28px; border-bottom: 1px solid #EEF2F6;">
        <tr>
          <!-- Left Decorative Ashoka Wave Graphic -->
          <td width="90" valign="middle" align="left">
            <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 50C10 27.9086 27.9086 10 50 10C72.0914 10 90 27.9086 90 50C90 72.0914 72.0914 90 50 90C27.9086 90 10 72.0914 10 50Z" fill="#FF9933" fill-opacity="0.15"/>
              <path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80C33.4315 80 20 66.5685 20 50Z" fill="#138808" fill-opacity="0.15"/>
              <circle cx="50" cy="50" r="24" stroke="#000080" stroke-width="2.5" fill="#FFFFFF"/>
              <circle cx="50" cy="50" r="4" fill="#000080"/>
              <!-- Spokes -->
              <g stroke="#000080" stroke-width="1.5">
                <line x1="50" y1="26" x2="50" y2="74"/><line x1="26" y1="50" x2="74" y2="50"/>
                <line x1="33" y1="33" x2="67" y2="67"/><line x1="33" y1="67" x2="67" y2="33"/>
                <line x1="40" y1="28" x2="60" y2="72"/><line x1="28" y1="40" x2="72" y2="60"/>
                <line x1="28" y1="60" x2="72" y2="40"/><line x1="40" y1="72" x2="60" y2="28"/>
              </g>
            </svg>
          </td>

          <!-- Center Festive Text -->
          <td valign="middle" align="center" style="padding: 0 10px;">
            <div style="font-family: 'Brush Script MT', 'Dancing Script', cursive, Georgia, serif; font-size: 26px; color: #D97706; font-style: italic; line-height: 1.1; margin-bottom: 2px;">
              Happy
            </div>
            <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 800; color: #0B132B; text-transform: uppercase; letter-spacing: 1px; line-height: 1.2;">
              Independence Day
            </div>
            
            <!-- Mini Tricolor Chakra Divider -->
            <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 8px auto 8px auto;">
              <tr>
                <td width="36" style="height: 2px; background-color: #FF9933; border-radius: 1px 0 0 1px;"></td>
                <td style="padding: 0 6px;" valign="middle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#000080" stroke-width="2"/>
                    <circle cx="12" cy="12" r="2" fill="#000080"/>
                    <line x1="12" y1="2" x2="12" y2="22" stroke="#000080" stroke-width="1.5"/>
                    <line x1="2" y1="12" x2="22" y2="12" stroke="#000080" stroke-width="1.5"/>
                    <line x1="5" y1="5" x2="19" y2="19" stroke="#000080" stroke-width="1.5"/>
                    <line x1="5" y1="19" x2="19" y2="5" stroke="#000080" stroke-width="1.5"/>
                  </svg>
                </td>
                <td width="36" style="height: 2px; background-color: #138808; border-radius: 0 1px 1px 0;"></td>
              </tr>
            </table>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11.5px; color: #64748B; line-height: 1.4; font-weight: 500;">
              Celebrating the spirit of freedom,<br>innovation & progress.
            </div>
          </td>

          <!-- Right India Gate Silhouette Graphic -->
          <td width="90" valign="middle" align="right">
            <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g fill="#D5C5B0">
                <rect x="20" y="96" width="80" height="6" rx="1"/>
                <rect x="26" y="88" width="68" height="8"/>
                <path d="M34 88V36H48V88H34ZM72 88V36H86V88H72Z"/>
                <rect x="28" y="32" width="64" height="6" rx="1"/>
                <rect x="36" y="24" width="48" height="8"/>
                <rect x="42" y="18" width="36" height="6" rx="1"/>
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
            <!-- Greeting -->
            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #1E293B; margin-bottom: 14px;">
              Hi <strong style="color: #0F172A; font-weight: 700;">${name}</strong>,
            </div>

            <!-- Heading -->
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #0F172A; margin-bottom: 12px; letter-spacing: -0.3px;">
              ${headingText}
            </div>

            <!-- Body Paragraph -->
            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
              ${subtitleText}
            </div>

            <!-- ================= OTP CARD CONTAINER ================= -->
            <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); margin-bottom: 30px; position: relative;">
              
              <!-- Top Saffron-White-Green Gradient Line -->
              <div style="height: 5px; background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%);"></div>

              <div style="padding: 32px 24px; text-align: center; position: relative;">
                
                <!-- Background Ashoka Chakra Watermark -->
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

                <!-- Label -->
                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 14px;">
                  ${codeLabel}
                </div>

                <!-- Digits -->
                <div class="otp-number" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 42px; font-weight: 900; color: #0F172A; letter-spacing: 16px; text-indent: 16px; margin: 16px 0;">
                  ${otp}
                </div>

                <!-- Expiry Tag -->
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

              <!-- CTA Button Section -->
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
                <!-- Left Chakra -->
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

                <!-- Center Quote & Jai Hind -->
                <td valign="middle" align="center" style="padding: 0 14px;">
                  <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-weight: 700; color: #1E293B; line-height: 1.45; margin-bottom: 8px;">
                    On this Independence Day,<br>we celebrate the freedom to learn, build and innovate.
                  </div>

                  <!-- Small Line -->
                  <div style="width: 80px; height: 2px; background: linear-gradient(90deg, #FF9933 0%, #138808 100%); margin: 6px auto;"></div>

                  <!-- Jai Hind Script -->
                  <div style="font-family: 'Brush Script MT', 'Playfair Display', Georgia, cursive, serif; font-size: 24px; font-style: italic; color: #C2410C; margin-top: 4px;">
                    Jai Hind <span style="font-style: normal; font-size: 16px;">🇮🇳</span>
                  </div>
                </td>

                <!-- Right Soldiers / Flag Hoisting Silhouette Graphic -->
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
            <!-- Official Transparent DevPhoeniX Logo -->
            <div style="margin-bottom: 16px; text-align: center;">
              <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX" width="160" style="max-height: 42px; width: 160px; height: auto; display: block; margin: 0 auto; border: 0; outline: none;" />
            </div>

            <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11.5px; color: #94A3B8; margin: 0 0 16px 0; letter-spacing: 0.5px;">
              Official AI-Powered Assessment & Online Examination Platform
            </p>

            <!-- Social Links Circles -->
            <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px auto;">
              <tr>
                <td style="padding: 0 6px;">
                  <a href="${clientUrl}" target="_blank" style="display: block; width: 34px; height: 34px; line-height: 34px; border-radius: 17px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; text-decoration: none; color: #FFFFFF; font-size: 14px;">
                    🌐
                  </a>
                </td>
                <td style="padding: 0 6px;">
                  <a href="https://facebook.com" target="_blank" style="display: block; width: 34px; height: 34px; line-height: 34px; border-radius: 17px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; text-decoration: none; color: #FFFFFF; font-size: 14px; font-weight: bold; font-family: sans-serif;">
                    f
                  </a>
                </td>
                <td style="padding: 0 6px;">
                  <a href="https://linkedin.com" target="_blank" style="display: block; width: 34px; height: 34px; line-height: 34px; border-radius: 17px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; text-decoration: none; color: #FFFFFF; font-size: 13px; font-weight: bold; font-family: sans-serif;">
                    in
                  </a>
                </td>
                <td style="padding: 0 6px;">
                  <a href="mailto:support@devphoenix.com" target="_blank" style="display: block; width: 34px; height: 34px; line-height: 34px; border-radius: 17px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; text-decoration: none; color: #FFFFFF; font-size: 13px;">
                    ✉️
                  </a>
                </td>
              </tr>
            </table>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #64748B;">
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

module.exports = {
  PUBLIC_LOGO_URL,
  renderBaseLayout,
  accountApprovedTemplate,
  independenceDayOtpTemplate,
};
