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
        body { margin: 0; padding: 0; background-color: #F5F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .email-outer { width: 100%; table-layout: fixed; background-color: #F5F7FA; padding: 40px 16px; }
        .email-card-container { max-width: 600px; margin: 0 auto; }
        
        /* Top Logo Wrap */
        .brand-logo-wrap { text-align: center; margin: 0 auto 24px auto; }
        .brand-logo-wrap img { max-height: 48px; max-width: 200px; width: 200px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; }
        
        /* Main Heading */
        .header-greeting { font-size: 24px; font-weight: 300; color: #1e293b; text-align: center; margin: 0 0 24px 0; line-height: 1.35; letter-spacing: -0.4px; }
        .header-greeting strong { font-weight: 700; color: #0f172a; }

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
        .footer-brand { font-size: 16px; font-weight: 700; color: #0F172A; text-align: center; margin-bottom: 6px; }
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
 * Refined, corporate, clean transactional email design with subtle Indian tricolor accents
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

  // Custom headings based on type
  const isForgot = type === 'forgot';
  const headingText = isForgot ? 'Reset your password' : 'Verify your email address';
  const subtitleText = isForgot
    ? 'We received a password reset request for your DevPhoeniX account. Use the secure verification code below to authorize your password reset.'
    : 'Welcome to DevPhoeniX Assessment. Use the secure verification code below to complete your registration and access your assessment.';
  const codeLabel = isForgot ? 'PASSWORD RESET VERIFICATION CODE' : 'EMAIL VERIFICATION CODE';
  const ctaText = isForgot ? 'Reset DevPhoeniX Password' : 'Access DevPhoeniX Assessment';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DevPhoeniX Verification Code</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F5F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    
    @media screen and (max-width: 640px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 28px 20px !important; }
      .otp-digits { font-size: 32px !important; letter-spacing: 8px !important; text-indent: 8px !important; }
      .header-logo { width: 180px !important; }
      .btn-cta { width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 36px 0; background-color: #F5F7FA;">
  <center style="width: 100%; table-layout: fixed; background-color: #F5F7FA;">
    <div style="max-width: 640px; margin: 0 auto; padding: 0 12px;">
      
      <!-- ================= MAIN EMAIL CARD ================= -->
      <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E6E8EC; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);">
        
        <!-- TOP BRAND HEADER WITH LOGO & INDEPENDENCE DAY ACCENT -->
        <tr>
          <td style="padding: 32px 36px 20px 36px; text-align: center; background-color: #FFFFFF;">
            
            <!-- DevPhoeniX Official Logo -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <img
                    src="${PUBLIC_LOGO_URL}"
                    alt="DevPhoeniX Technologies LLP"
                    width="200"
                    class="header-logo"
                    style="display: block; width: 200px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none;"
                  />
                </td>
              </tr>
            </table>

            <!-- Independence Day Pill Badge -->
            <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 16px auto; background-color: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 20px; padding: 4px 14px;">
              <tr>
                <td style="font-size: 14px; line-height: 1; padding-right: 6px;" valign="middle">🇮🇳</td>
                <td style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #7E22CE; letter-spacing: 0.8px; text-transform: uppercase; line-height: 1;" valign="middle">
                  ${dateString} — INDEPENDENCE DAY EDITION
                </td>
              </tr>
            </table>

            <!-- Subtle Indian Tricolor Divider -->
            <table align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 280px; margin: 0 auto 16px auto;">
              <tr>
                <td width="33%" style="height: 3px; background-color: #FF9933; border-radius: 2px 0 0 2px;"></td>
                <td width="34%" style="height: 3px; background-color: #E2E8F0;"></td>
                <td width="33%" style="height: 3px; background-color: #138808; border-radius: 0 2px 2px 0;"></td>
              </tr>
            </table>

            <!-- Hero Subtitle -->
            <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.5px; color: #64748B; margin: 0; line-height: 1.5; font-weight: 500;">
              Happy Independence Day · Celebrating the spirit of freedom, innovation & progress.
            </p>

          </td>
        </tr>

        <!-- DIVIDER LINE -->
        <tr>
          <td style="height: 1px; background-color: #F1F5F9; line-height: 1px; font-size: 1px;">&nbsp;</td>
        </tr>

        <!-- ================= CONTENT BODY ================= -->
        <tr>
          <td class="content-padding" style="padding: 36px 44px 36px 44px;">
            
            <!-- Greeting -->
            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #334155; margin-bottom: 12px; line-height: 1.4;">
              Hi <strong style="color: #0F172A; font-weight: 700;">${name}</strong>,
            </div>

            <!-- Main Heading -->
            <h1 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: 800; color: #0F172A; margin: 0 0 10px 0; letter-spacing: -0.4px; line-height: 1.3;">
              ${headingText}
            </h1>

            <!-- Description -->
            <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 28px 0;">
              ${subtitleText}
            </p>

            <!-- ================= DEDICATED OTP CARD ================= -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 14px; margin: 0 0 28px 0; text-align: center;">
              <tr>
                <td style="padding: 28px 20px; text-align: center;">
                  
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">
                    ${codeLabel}
                  </div>

                  <!-- Large 6-Digit OTP -->
                  <div class="otp-digits" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; color: #0F172A; letter-spacing: 12px; text-indent: 12px; line-height: 1.2; margin: 8px 0 14px 0;">
                    ${otp}
                  </div>

                  <!-- Validity Tag -->
                  <div style="display: inline-block; background-color: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.2); border-radius: 20px; padding: 5px 14px;">
                    <span style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #0284C7;">
                      ⏱️ Valid for ${expireMinutes} minutes
                    </span>
                  </div>

                </td>
              </tr>
            </table>

            <!-- ================= CALL TO ACTION BUTTON ================= -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0;">
              <tr>
                <td align="center">
                  <a
                    href="${clientUrl}"
                    target="_blank"
                    class="btn-cta"
                    style="display: inline-block; background: linear-gradient(135deg, #E63946 0%, #F77F00 100%); color: #FFFFFF; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(230, 57, 70, 0.35); text-align: center;"
                  >
                    ${ctaText}
                  </a>
                </td>
              </tr>
            </table>

            <!-- ================= SECURITY NOTICE BOX ================= -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFF1F2; border-left: 4px solid #F43F5E; border-radius: 8px; padding: 14px 18px;">
              <tr>
                <td valign="top" style="padding-right: 10px; font-size: 16px; line-height: 1.4;">
                  🔒
                </td>
                <td valign="top">
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #9F1239; margin-bottom: 2px;">
                    Security Notice
                  </div>
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.5px; line-height: 1.5; color: #BE123C;">
                    Never share this verification code with anyone. DevPhoeniX administrators will never ask you to disclose your OTP. If you did not initiate this request, you can safely ignore this email.
                  </div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- DIVIDER LINE -->
        <tr>
          <td style="height: 1px; background-color: #F1F5F9; line-height: 1px; font-size: 1px;">&nbsp;</td>
        </tr>

        <!-- ================= FOOTER SECTION ================= -->
        <tr>
          <td style="padding: 28px 36px 32px 36px; text-align: center; background-color: #FAFAFA;">
            
            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1E293B; margin-bottom: 4px;">
              DevPhoeniX Technologies LLP
            </div>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #64748B; margin-bottom: 12px;">
              Official AI-Assessment & Online Examination Platform
            </div>

            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #94A3B8; line-height: 1.5;">
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
