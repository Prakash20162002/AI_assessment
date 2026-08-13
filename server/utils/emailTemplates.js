/**
 * DevPhoeniX Premium Email Templates Collection
 * Production-ready transactional email templates
 * Premium Independence Day Edition 🇮🇳 (15 August 2026)
 */

const PUBLIC_LOGO_URL = 'https://ai-assessment-beta.vercel.app/logo.png';
const getClientUrl = () => process.env.CLIENT_URL || 'https://ai-assessment-beta.vercel.app/';

/**
 * Base Wrapper Layout for general DevPhoeniX emails
 */
const renderBaseLayout = ({ name, mainHeading, contentHtml }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPhoeniX Technologies LLP</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0A0F1D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .email-outer { width: 100%; table-layout: fixed; background-color: #0A0F1D; padding: 48px 16px; }
    .email-card-container { max-width: 640px; margin: 0 auto; }
    .brand-logo-wrap { text-align: center; margin: 0 auto 28px auto; }
    .brand-logo-wrap img { max-height: 52px; max-width: 210px; width: 210px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; }
    .header-greeting { font-size: 24px; font-weight: 300; color: #ffffff; text-align: center; margin: 0 0 24px 0; line-height: 1.35; }
    .header-greeting strong { font-weight: 700; color: #ffffff; }
    .card-box { background-color: #ffffff; border-radius: 20px; padding: 40px 36px; margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); text-align: center; }
    .card-text { font-size: 15px; line-height: 1.65; color: #475569; text-align: center; margin: 0 0 24px 0; }
    .btn-action { display: inline-block; background: linear-gradient(135deg, #E63946 0%, #F77F00 100%); color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(230, 57, 70, 0.3); text-align: center; }
    .footer-brand { font-size: 16px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 6px; }
    .footer-text { font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="email-outer">
    <div class="email-card-container">
      <div class="brand-logo-wrap">
        <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies LLP" width="210" style="max-height: 52px; width: 210px; height: auto; display: block; margin: 0 auto; border: 0;" />
      </div>
      <h1 class="header-greeting">
        Hi <strong>${name || 'Student'}</strong>,<br>
        ${mainHeading}
      </h1>
      ${contentHtml}
      <div style="margin-top: 36px; text-align: center;">
        <div class="footer-brand">DevPhoeniX Technologies LLP</div>
        <p class="footer-text">Building Intelligent Digital Ecosystems</p>
        <p class="footer-text">Official AI-Assessment & Online Examination Platform</p>
        <p class="footer-text">© ${new Date().getFullYear()} DevPhoeniX Technologies LLP. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Account Approval / Welcome Email Template
 */
const accountApprovedTemplate = ({ name, networkName = 'DevPhoeniX Assessment' }) => {
  const contentHtml = `
    <div class="card-box">
      <svg style="width: 64px; height: 64px; margin: 0 auto 20px auto; display: block;" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="36" fill="#F0FDF4"/>
        <path d="M20 26C20 23.7909 21.7909 22 24 22H48C50.2091 22 52 23.7909 52 26V46C52 48.2091 50.2091 50 48 50H24C21.7909 50 20 48.2091 20 46V26Z" fill="#FFFFFF" stroke="#16A34A" stroke-width="2.5"/>
        <path d="M22 24L36 36L50 24" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="36" cy="38" r="10" fill="#22C55E"/>
        <path d="M32 38L35 41L40 35" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p class="card-text">
        Your DevPhoeniX account has been verified and you can now log in to the assessment platform.
      </p>
      <p class="card-text" style="color: #64748b; font-size: 13.5px;">
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
 * DevPhoeniX Premium Independence Day Edition OTP Email Template
 * Sophisticated corporate email with generous spacing, Indian tricolor accents,
 * dynamic OTP focal point, security card, Independence Day hero, and official footer.
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
  const studentGreeting = name && name.trim() && name !== 'User' && name !== 'Student' ? `Hi <strong>${name}</strong>,` : 'Hello,';

  const isForgot = type === 'forgot';
  const headingText = isForgot ? 'Reset your password' : 'Verify your email address';
  const subtitleText = isForgot
    ? 'We received a password reset request for your DevPhoeniX account. Use the secure verification code below to authorize your password reset.'
    : 'Welcome to DevPhoeniX Assessment. Use the secure verification code below to complete your registration and access your assessment.';
  const codeLabel = isForgot ? 'PASSWORD RESET VERIFICATION CODE' : 'EMAIL VERIFICATION CODE';
  const ctaText = isForgot ? '🔒 Reset DevPhoeniX Password' : '🔒 Access DevPhoeniX Assessment';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DevPhoeniX Assessment — Independence Day Edition</title>
  <style>
    /* Reset & Base Styles */
    body, html {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #0A0F1D;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    table, td {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      display: block;
    }

    /* Responsive Mobile Styles (320px - 600px) */
    @media screen and (max-width: 640px) {
      .email-outer-table {
        padding: 16px 8px !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 16px !important;
      }
      .header-pad {
        padding: 24px 20px !important;
      }
      .hero-pad {
        padding: 28px 20px 24px 20px !important;
      }
      .content-pad {
        padding: 28px 20px 20px 20px !important;
      }
      .card-pad {
        padding: 26px 18px !important;
      }
      .footer-pad {
        padding: 32px 20px !important;
      }
      .header-logo-img {
        max-width: 170px !important;
        width: 170px !important;
      }
      .otp-number {
        font-size: 34px !important;
        letter-spacing: 10px !important;
        text-indent: 10px !important;
      }
      .hide-on-mobile {
        display: none !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0F1D;">
  
  <!-- Outer Wrapper Table with Generous Padding -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-outer-table" style="background-color: #0A0F1D; padding: 48px 16px;">
    <tr>
      <td align="center" valign="top">
        
        <!-- Main Email Container Box (Max 640px) -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.08);">
          
          <!-- ================= 1. HEADER SECTION (#0B132B) ================= -->
          <tr>
            <td style="background-color: #0B132B; padding: 32px 48px;" class="header-pad">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- DevPhoeniX Brand Logo -->
                  <td align="left" valign="middle">
                    <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies" width="200" class="header-logo-img" style="max-height: 48px; width: 200px; height: auto; display: block; border: 0; outline: none;" />
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; font-weight: 700; color: #F77F00; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">
                      Assessment Platform
                    </div>
                  </td>

                  <!-- 15 August 2026 Independence Day Badge -->
                  <td align="right" valign="middle">
                    <table cellpadding="0" cellspacing="0" border="0" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 12px; padding: 8px 14px;">
                      <tr>
                        <td valign="middle" style="padding-right: 8px;">
                          <!-- Indian Flag SVG -->
                          <svg width="22" height="15" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="22" height="5" fill="#FF9933" rx="1"/>
                            <rect y="5" width="22" height="5" fill="#FFFFFF"/>
                            <rect y="10" width="22" height="5" fill="#138808" rx="1"/>
                            <circle cx="11" cy="7.5" r="2" fill="#000080"/>
                          </svg>
                        </td>
                        <td valign="middle" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.2px; text-transform: uppercase; line-height: 1.3;">
                          ${dateString}<br>
                          <span style="color: #4ADE80; font-size: 8.5px; letter-spacing: 1px;">INDEPENDENCE DAY EDITION</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ================= 2. INDEPENDENCE DAY HERO SECTION ================= -->
          <tr>
            <td style="background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%); padding: 36px 48px 28px 48px; border-bottom: 1px solid #EEF2F6;" class="hero-pad">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left Chakra Graphic -->
                  <td width="76" valign="middle" align="left" class="hide-on-mobile" style="padding-right: 12px;">
                    <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="46" fill="#FFF7ED" stroke="#FF9933" stroke-width="2"/>
                      <circle cx="50" cy="50" r="36" fill="#F0FDF4" stroke="#138808" stroke-width="1.5"/>
                      <circle cx="50" cy="50" r="22" stroke="#000080" stroke-width="2.5" fill="#FFFFFF"/>
                      <circle cx="50" cy="50" r="4" fill="#000080"/>
                      <g stroke="#000080" stroke-width="1.5">
                        <line x1="50" y1="28" x2="50" y2="72"/><line x1="28" y1="50" x2="72" y2="50"/>
                        <line x1="34" y1="34" x2="66" y2="66"/><line x1="34" y1="66" x2="66" y2="34"/>
                        <line x1="41" y1="30" x2="59" y2="70"/><line x1="30" y1="41" x2="70" y2="59"/>
                        <line x1="30" y1="59" x2="70" y2="41"/><line x1="41" y1="70" x2="59" y2="30"/>
                      </g>
                    </svg>
                  </td>

                  <!-- Center Text -->
                  <td valign="middle" align="center" style="padding: 0 8px;">
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 800; color: #0B132B; text-transform: uppercase; letter-spacing: 1.2px; line-height: 1.25; margin-bottom: 6px;">
                      Happy Independence Day <span style="font-size: 20px;">🇮🇳</span>
                    </div>

                    <!-- Subtle Tricolor Divider -->
                    <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 10px auto;">
                      <tr>
                        <td width="48" style="height: 2.5px; background-color: #FF9933; border-radius: 2px 0 0 2px;"></td>
                        <td style="padding: 0 8px;" valign="middle">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="#000080" stroke-width="2.5"/>
                            <circle cx="12" cy="12" r="2.5" fill="#000080"/>
                            <line x1="12" y1="2" x2="12" y2="22" stroke="#000080" stroke-width="1.5"/>
                            <line x1="2" y1="12" x2="22" y2="12" stroke="#000080" stroke-width="1.5"/>
                          </svg>
                        </td>
                        <td width="48" style="height: 2.5px; background-color: #138808; border-radius: 0 2px 2px 0;"></td>
                      </tr>
                    </table>

                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.5px; color: #64748B; line-height: 1.5; font-weight: 500;">
                      Celebrating the spirit of freedom, innovation & progress.
                    </div>
                  </td>

                  <!-- Right India Gate Graphic -->
                  <td width="76" valign="middle" align="right" class="hide-on-mobile" style="padding-left: 12px;">
                    <svg width="70" height="70" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g fill="#D5C5B0">
                        <rect x="20" y="96" width="80" height="6" rx="1"/>
                        <rect x="26" y="88" width="68" height="8"/>
                        <path d="M34 88V36H48V88H34ZM72 88V36H86V88H72Z"/>
                        <rect x="28" y="32" width="64" height="6" rx="1"/>
                        <rect x="36" y="24" width="48" height="8"/>
                        <rect x="42" y="18" width="36" height="6" rx="1"/>
                      </g>
                      <g fill="#C5B39C">
                        <path d="M50 96V65C50 57 70 57 70 65V96H64V65C64 61 56 61 56 65V96H50Z"/>
                        <rect x="34" y="48" width="52" height="3"/>
                      </g>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ================= 3. MAIN MESSAGE & OTP SECTION ================= -->
          <tr>
            <td style="padding: 40px 48px 24px 48px;" class="content-pad">
              
              <!-- Personal Greeting -->
              <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #1E293B; margin-bottom: 12px; line-height: 1.5;">
                ${studentGreeting}
              </div>

              <!-- Main Heading -->
              <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #0F172A; margin-bottom: 14px; letter-spacing: -0.4px; line-height: 1.3;">
                ${headingText}
              </div>

              <!-- Body Paragraph with Comfortable Line Length & Spacing -->
              <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #475569; margin-bottom: 34px;">
                ${subtitleText}
              </div>

              <!-- ================= 4. OTP CARD (PRIMARY FOCAL POINT) ================= -->
              <div style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.06); margin-bottom: 32px; position: relative;">
                
                <!-- Tricolor Accent Top Stripe -->
                <div style="height: 5px; background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%);"></div>

                <!-- OTP Card Body with Generous Internal Padding (36px 32px) -->
                <div style="padding: 36px 32px; text-align: center;" class="card-pad">
                  
                  <!-- Code Subtitle / Label -->
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11.5px; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 14px;">
                    ${codeLabel}
                  </div>

                  <!-- 6-Digit Highlighted OTP Code -->
                  <div class="otp-number" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 44px; font-weight: 900; color: #0F172A; letter-spacing: 16px; text-indent: 16px; margin: 18px 0; user-select: all;">
                    ${otp}
                  </div>

                  <!-- Validity Expiry Tag -->
                  <div style="display: inline-block; background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 24px; padding: 7px 20px; margin-top: 10px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding-right: 7px;">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </td>
                        <td valign="middle" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.5px; font-weight: 700; color: #0284C7;">
                          Valid for ${expireMinutes} minutes
                        </td>
                      </tr>
                    </table>
                  </div>

                </div>
              </div>

              <!-- ================= 5. ASSESSMENT CTA BUTTON ================= -->
              <div style="padding: 4px 0 32px 0; text-align: center;">
                <a href="${clientUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #E63946 0%, #F77F00 100%); color: #FFFFFF !important; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 38px; border-radius: 12px; box-shadow: 0 6px 20px rgba(230, 57, 70, 0.35); text-shadow: 0 1px 2px rgba(0,0,0,0.25);">
                  ${ctaText}
                </a>
              </div>

              <!-- ================= 6. SECURITY REMINDER CARD ================= -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F0FDF4; border: 1.5px solid #DCFCE7; border-radius: 16px; padding: 22px 26px; margin-bottom: 28px;" class="card-pad">
                <tr>
                  <td width="44" valign="middle" style="padding-right: 16px;">
                    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="48" height="48" rx="24" fill="#22C55E"/>
                      <path d="M24 12L14 17V24C14 31 18.5 37.5 24 40C29.5 37.5 34 31 34 24V17L24 12Z" fill="#22C55E" stroke="#FFFFFF" stroke-width="2.5"/>
                      <path d="M20 24L23 27L28 21" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td valign="middle">
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.5px; font-weight: 700; color: #166534; margin-bottom: 4px;">
                      Security reminder
                    </div>
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.55; color: #15803D;">
                      Never share this verification code with anyone. DevPhoeniX will never ask you to disclose your OTP. If you did not request this verification code, you can safely ignore this email.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ================= 7. INDEPENDENCE DAY MESSAGE BANNER ================= -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1.5px solid #FDE68A; border-radius: 16px; padding: 24px 26px; margin-bottom: 12px;" class="card-pad">
                <tr>
                  <!-- Left Chakra -->
                  <td width="48" valign="middle" align="center" style="padding-right: 12px;">
                    <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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

                  <!-- Center Text Quote & Jai Hind -->
                  <td valign="middle" align="center" style="padding: 0 10px;">
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; font-weight: 700; color: #1E293B; line-height: 1.45; margin-bottom: 8px;">
                      On this Independence Day,<br>we celebrate the freedom to learn, build and innovate.
                    </div>

                    <!-- Saffron to Green Gradient Line -->
                    <div style="width: 80px; height: 2.5px; background: linear-gradient(90deg, #FF9933 0%, #138808 100%); margin: 6px auto; border-radius: 2px;"></div>

                    <!-- Jai Hind Script -->
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 800; font-style: italic; color: #C2410C; margin-top: 4px;">
                      Jai Hind <span style="font-style: normal; font-size: 15px;">🇮🇳</span>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ================= 8. DARK FOOTER SECTION (#0B132B) ================= -->
          <tr>
            <td style="background-color: #0B132B; padding: 40px 48px; text-align: center;" class="footer-pad">
              
              <!-- Footer Transparent Logo with Breathing Room -->
              <div style="margin-bottom: 18px; text-align: center;">
                <img src="${PUBLIC_LOGO_URL}" alt="DevPhoeniX Technologies" width="180" style="max-height: 44px; width: 180px; height: auto; display: block; margin: 0 auto; border: 0; outline: none;" />
              </div>

              <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; margin-bottom: 4px;">
                DevPhoeniX Technologies LLP
              </div>

              <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #94A3B8; margin-bottom: 12px;">
                Building Intelligent Digital Ecosystems
              </div>

              <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11.5px; color: #64748B; margin: 0 0 20px 0; line-height: 1.5;">
                Official AI-Powered Assessment & Online Examination Platform
              </p>

              <!-- Social Links Table -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="${clientUrl}" target="_blank" style="display: block; width: 36px; height: 36px; line-height: 36px; border-radius: 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; text-decoration: none; color: #FFFFFF; font-size: 14px;">
                      🌐
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://linkedin.com" target="_blank" style="display: block; width: 36px; height: 36px; line-height: 36px; border-radius: 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; text-decoration: none; color: #FFFFFF; font-size: 13px; font-weight: bold; font-family: sans-serif;">
                      in
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="mailto:support@devphoenix.com" target="_blank" style="display: block; width: 36px; height: 36px; line-height: 36px; border-radius: 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; text-decoration: none; color: #FFFFFF; font-size: 13px;">
                      ✉️
                    </a>
                  </td>
                </tr>
              </table>

              <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #475569; line-height: 1.5;">
                Copyright © ${year} DevPhoeniX Technologies LLP. All rights reserved.
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};

module.exports = {
  PUBLIC_LOGO_URL,
  renderBaseLayout,
  accountApprovedTemplate,
  independenceDayOtpTemplate,
};
