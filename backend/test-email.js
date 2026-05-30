/**
 * Quick SMTP smoke test — run from the backend directory:
 *   node test-email.js
 *
 * Reads .env.development and sends one test email to SMTP_USER.
 */

require('dotenv').config({ path: '.env.development' });
const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌  SMTP_USER or SMTP_PASS not set in .env.development');
  process.exit(1);
}

console.log(`\n📧  Testing SMTP connection...`);
console.log(`    Host : ${SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`    Port : ${SMTP_PORT || 587}`);
console.log(`    User : ${SMTP_USER}`);
console.log(`    From : ${FROM_EMAIL || SMTP_USER}\n`);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.titan.email',
  port: Number(SMTP_PORT) || 465,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false },
});

(async () => {
  try {
    await transporter.verify();
    console.log('✅  SMTP connection verified — credentials are valid\n');

    const info = await transporter.sendMail({
      from: `"Syllabrix" <${FROM_EMAIL || SMTP_USER}>`,
      to: SMTP_USER,
      subject: '✅ Syllabrix SMTP test — it works!',
      html: `
        <div style="font-family:sans-serif;padding:32px;max-width:480px;">
          <h2 style="color:#1E3A5F;">Email delivery confirmed</h2>
          <p>Your Gmail SMTP configuration is working correctly.</p>
          <p style="color:#6B7280;font-size:13px;">Sent at: ${new Date().toISOString()}</p>
        </div>`,
    });

    console.log('✅  Test email sent successfully!');
    console.log(`    Message ID : ${info.messageId}`);
    console.log(`    Check inbox: ${SMTP_USER}\n`);
  } catch (err) {
    console.error('❌  SMTP test failed:\n');
    console.error(`    ${err.message}\n`);

    if (err.message.includes('Invalid login') || err.message.includes('Username and Password')) {
      console.error('    → The Gmail App Password is wrong or expired.');
      console.error('    → Go to: myaccount.google.com → Security → App Passwords');
      console.error('    → Generate a new 16-char app password and update SMTP_PASS in .env.development\n');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      console.error('    → Cannot reach smtp.gmail.com:587. Check your internet/firewall.\n');
    } else if (err.message.includes('Less secure')) {
      console.error('    → Enable 2FA on your Google account, then use an App Password (not your real password).\n');
    }

    process.exit(1);
  }
})();
