const nodemailer = require('nodemailer');
const config = require('../config/env');

// ── Resend (preferred for production) ─────────────────────────────────────────
const sendViaResend = async ({ to, subject, html }) => {
  const { Resend } = require('resend');
  const client = new Resend(process.env.RESEND_API_KEY);
  const from = config.fromEmail
    ? `Syllabrix <${config.fromEmail}>`
    : 'Syllabrix <onboarding@resend.dev>';
  const { error } = await client.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message);
};

// ── Nodemailer (fallback for local dev via SMTP) ───────────────────────────────
const createTransporter = () => {
  const user = config.smtpUser;
  const pass = config.smtpPass;
  if (!user || !pass) return null;
  const host = config.smtpHost || 'smtpout.secureserver.net';
  const port = Number(config.smtpPort) || 587;
  const secure = port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    ...(port === 587 && { requireTLS: true }),
  });
};

const FROM = () => `"Syllabrix" <${config.fromEmail || config.smtpUser}>`;

const logFallback = (label, link) => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📧  ${label} (email not configured)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(link);
  console.log(`Add SMTP_USER + SMTP_PASS to .env to send real emails.`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
};

// ── Shared layout wrapper ──────────────────────────────────────────────────────
const layout = ({ preheader, headerTag, bodyHtml, footerNote, frontendUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Syllabrix</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#F0F4F8;">
    ${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0F4F8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F2942 0%,#1E3A5F 50%,#0E6B7A 100%);border-radius:16px 16px 0 0;padding:36px 40px 32px;text-align:center;">

              <!-- Logo / Wordmark -->
              <img src="https://syllabrix.com/logo.png" alt="Syllabrix" width="140" style="display:block;margin:0 auto 16px;height:auto;max-width:140px;" />
              <div style="font-size:32px;font-weight:900;color:#FFFFFF;letter-spacing:-0.03em;line-height:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Syllab<span style="color:#17B9D0;">rix</span>
              </div>
              <div style="margin-top:6px;font-size:12px;font-weight:500;color:rgba(255,255,255,0.55);letter-spacing:0.12em;text-transform:uppercase;">
                Business ERP Platform
              </div>

              <!-- Divider -->
              <div style="width:48px;height:3px;background:linear-gradient(90deg,#17B9D0,#34D399);border-radius:2px;margin:20px auto 0;"></div>

              <!-- Header tag -->
              ${headerTag ? `<div style="margin-top:20px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:5px 16px;display:inline-block;">${headerTag}</div>` : ''}
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#FFFFFF;padding:40px 40px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#94A3B8;">
                ${footerNote || 'If you did not request this email, you can safely ignore it.'}
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#CBD5E1;">
                Need help? Reply to this email or visit
                <a href="${frontendUrl}/support" style="color:#17B9D0;text-decoration:none;">support@syllabrix.com</a>
              </p>
              <div style="border-top:1px solid #E2E8F0;margin:16px 0;"></div>
              <p style="margin:0;font-size:11px;color:#CBD5E1;">
                © ${new Date().getFullYear()} Syllabrix · Built for Indian businesses
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#CBD5E1;">
                Syllabrix Technologies Pvt. Ltd.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

// ── Trial Verification Email ───────────────────────────────────────────────────
const sendVerificationEmail = async (toEmail, businessName, token, trialDays = 14) => {
  const frontendUrl = process.env.FRONTEND_URL || (config.clientUrl || 'http://localhost:5173').split(',')[0].trim();
  const verifyLink = `${frontendUrl}/verify-email?token=${token}`;
  const name = businessName || 'there';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Start Your Syllabrix Trial</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#F0F4F8;">
    One click to unlock your ${trialDays}-day free trial — no credit card needed.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0A1F35 0%,#0F2942 40%,#0B5E70 100%);border-radius:16px 16px 0 0;padding:0;overflow:hidden;">

            <!-- Top accent bar -->
            <div style="height:4px;background:linear-gradient(90deg,#17B9D0 0%,#34D399 50%,#17B9D0 100%);"></div>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:36px 40px 32px;text-align:center;">

                  <!-- Logo -->
                  <img src="https://syllabrix.com/logo.png" alt="Syllabrix" width="150" style="display:block;margin:0 auto 20px;height:auto;max-width:150px;"/>

                  <!-- Trial badge -->
                  <div style="display:inline-block;background:rgba(23,185,208,0.15);border:1px solid rgba(23,185,208,0.4);border-radius:30px;padding:6px 20px;margin-bottom:20px;">
                    <span style="font-size:12px;font-weight:700;color:#4DD8EC;letter-spacing:0.1em;text-transform:uppercase;">🎯 &nbsp; ${trialDays}-Day Free Trial</span>
                  </div>

                  <!-- Headline -->
                  <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:-0.02em;line-height:1.2;">
                    Your trial is <span style="color:#17B9D0;">one click</span> away
                  </h1>
                  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
                    Verify your email to activate <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on Syllabrix
                  </p>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="background:#FFFFFF;padding:40px 40px 36px;">

            <!-- Welcome line -->
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;text-align:center;">
              Hi <strong style="color:#0F2942;">${name}</strong> 👋 — welcome to Syllabrix!<br/>
              Click below to verify your email and start your <strong style="color:#0B5E70;">${trialDays}-day free trial</strong>.<br/>
              <span style="font-size:13px;color:#94A3B8;">No credit card required. Cancel anytime.</span>
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
              <tr>
                <td align="center">
                  <a href="${verifyLink}"
                     style="display:inline-block;padding:18px 56px;background:linear-gradient(135deg,#17B9D0 0%,#0B9DB2 100%);color:#FFFFFF;text-decoration:none;border-radius:14px;font-size:17px;font-weight:800;letter-spacing:0.01em;box-shadow:0 6px 24px rgba(23,185,208,0.4);">
                    ✓ &nbsp; Verify Email &amp; Start Trial
                  </a>
                  <p style="margin:10px 0 0;font-size:12px;color:#CBD5E1;">Link expires in 24 hours</p>
                </td>
              </tr>
            </table>

            <!-- What's included -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#F8FAFC,#F0FDFA);border:1px solid #CBD5E1;border-radius:14px;margin-bottom:28px;">
              <tr>
                <td style="padding:22px 24px 18px;">
                  <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;text-align:center;">What's included in your trial</p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="33%" style="text-align:center;padding:0 8px 12px;">
                        <div style="font-size:26px;margin-bottom:6px;">🧾</div>
                        <div style="font-size:12px;font-weight:700;color:#0F2942;margin-bottom:2px;">GST Invoicing</div>
                        <div style="font-size:11px;color:#94A3B8;">Bills, quotations &amp; credit notes</div>
                      </td>
                      <td width="33%" style="text-align:center;padding:0 8px 12px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
                        <div style="font-size:26px;margin-bottom:6px;">📦</div>
                        <div style="font-size:12px;font-weight:700;color:#0F2942;margin-bottom:2px;">Inventory &amp; POS</div>
                        <div style="font-size:11px;color:#94A3B8;">Stock, sales &amp; purchase orders</div>
                      </td>
                      <td width="33%" style="text-align:center;padding:0 8px 12px;">
                        <div style="font-size:26px;margin-bottom:6px;">📊</div>
                        <div style="font-size:12px;font-weight:700;color:#0F2942;margin-bottom:2px;">Smart Reports</div>
                        <div style="font-size:11px;color:#94A3B8;">P&amp;L, tax &amp; business insights</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Trial countdown box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="vertical-align:middle;padding-right:14px;font-size:22px;line-height:1;width:32px;">⏱️</td>
                      <td>
                        <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#92400E;">Your ${trialDays}-day trial begins when you verify</p>
                        <p style="margin:0;font-size:12px;color:#B45309;line-height:1.5;">
                          Full access to all features. No payment until your trial ends — and only if you choose to continue.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="border-top:1px solid #F1F5F9;margin:24px 0;"></div>

            <!-- Fallback link -->
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;">Can't click the button?</p>
            <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;">Copy and paste this link into your browser:</p>
            <p style="margin:0;font-size:11px;color:#17B9D0;word-break:break-all;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-family:monospace;">${verifyLink}</p>

          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;">
              If you did not sign up for Syllabrix, you can safely ignore this email.
            </p>
            <p style="margin:0 0 12px;font-size:12px;color:#CBD5E1;">
              Need help? &nbsp;<a href="${frontendUrl}/support" style="color:#17B9D0;text-decoration:none;">support@syllabrix.com</a>
            </p>
            <div style="border-top:1px solid #E2E8F0;margin:14px 0 12px;"></div>
            <p style="margin:0 0 4px;font-size:11px;color:#CBD5E1;">© ${new Date().getFullYear()} Syllabrix · Built for Indian businesses</p>
            <p style="margin:0;font-size:11px;color:#CBD5E1;">Syllabrix Technologies Pvt. Ltd.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to: toEmail, subject: `🚀 Verify your email — start your ${trialDays}-day Syllabrix trial`, html });
  } else {
    const transporter = createTransporter();
    if (!transporter) { logFallback('EMAIL VERIFICATION LINK', verifyLink); return; }
    await transporter.sendMail({ from: FROM(), to: toEmail, subject: `🚀 Verify your email — start your ${trialDays}-day Syllabrix trial`, html });
  }
  console.log(`[EMAIL] Trial verification sent to ${toEmail}`);
};

// ── Password Reset Email ───────────────────────────────────────────────────────
const sendPasswordResetEmail = async (toEmail, token) => {
  const frontendUrl = process.env.FRONTEND_URL || (config.clientUrl || 'http://localhost:5173').split(',')[0].trim();
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;



  const html = layout({
    frontendUrl,
    preheader: 'Someone requested a password reset for your Syllabrix account. Click to set a new password.',
    headerTag: '🔑 &nbsp; Password Reset',
    bodyHtml: `
      <!-- Greeting -->
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F2942;letter-spacing:-0.02em;">
        Reset your password
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#64748B;line-height:1.6;">
        We received a request to reset the password for your Syllabrix account linked to
        <strong style="color:#0F2942;">${toEmail}</strong>.
      </p>

      <!-- Warning box -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;padding-right:14px;font-size:24px;line-height:1;">⚠️</td>
                <td>
                  <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#92400E;">Didn't request this?</p>
                  <p style="margin:0;font-size:13px;color:#78350F;line-height:1.5;">
                    If you didn't request a password reset, ignore this email — your password will remain unchanged.
                    This link expires in <strong>1 hour</strong>.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${resetLink}"
               style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#1E3A5F,#0F2942);color:#FFFFFF;text-decoration:none;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.01em;box-shadow:0 4px 16px rgba(15,41,66,0.3);">
              🔑 &nbsp; Reset My Password
            </a>
          </td>
        </tr>
      </table>

      <!-- Security note -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#475569;">🛡️ &nbsp; Security tip</p>
            <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">
              Syllabrix will never ask for your password over email or phone. Always reset passwords only through official links.
            </p>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="border-top:1px solid #F1F5F9;margin:24px 0;"></div>

      <!-- Copy link fallback -->
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;">
        Can't click the button?
      </p>
      <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Copy and paste this link into your browser:</p>
      <p style="margin:0;font-size:11px;color:#17B9D0;word-break:break-all;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-family:monospace;">
        ${resetLink}
      </p>`,
    footerNote: 'This password reset link is valid for 1 hour. After that, you will need to request a new one.',
  });

  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to: toEmail, subject: '🔑 Reset your Syllabrix password', html });
  } else {
    const transporter = createTransporter();
    if (!transporter) { logFallback('PASSWORD RESET LINK', resetLink); return; }
    await transporter.sendMail({ from: FROM(), to: toEmail, subject: '🔑 Reset your Syllabrix password', html });
  }
  console.log(`[EMAIL] Password reset sent to ${toEmail}`);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
