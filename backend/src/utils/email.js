const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use Gmail App Password (not account password)
      },
    });
  }
  return null;
};

const sendPasswordResetEmail = async (toEmail, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const transporter = createTransporter();

  if (!transporter) {
    // No email configured — log to console for development
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑  PASSWORD RESET LINK (email not configured)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(resetLink);
    console.log('Add EMAIL_USER + EMAIL_PASS to .env to send real emails.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  await transporter.sendMail({
    from: `"Syllabrix" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your Syllabrix password',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background:#1E3A5F;padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Syllabrix</h1>
          <p style="margin:4px 0 0;color:#93C5FD;font-size:13px;">Business ERP</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#1E3A5F;font-size:20px;font-weight:700;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#6B7280;font-size:15px;line-height:1.6;">
            We received a request to reset the password for your Syllabrix account.
            Click the button below to choose a new password.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;padding:14px 28px;background:#1E3A5F;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
            Reset Password
          </a>
          <p style="margin:24px 0 0;color:#9CA3AF;font-size:13px;line-height:1.6;">
            This link expires in <strong>1 hour</strong>.
            If you didn't request a password reset, you can safely ignore this email — your password will not change.
          </p>
          <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;">
          <p style="margin:0;color:#D1D5DB;font-size:11px;">
            Can't click the button? Copy this link:<br>
            <span style="color:#6B7280;word-break:break-all;">${resetLink}</span>
          </p>
        </td></tr>
        <tr><td style="background:#F9FAFB;padding:16px 32px;text-align:center;">
          <p style="margin:0;color:#9CA3AF;font-size:12px;">
            © ${new Date().getFullYear()} Syllabrix. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

module.exports = { sendPasswordResetEmail };
