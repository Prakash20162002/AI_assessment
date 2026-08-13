const { independenceDayOtpTemplate } = require('../server/utils/emailTemplates');

console.log('Generating test HTML for DevPhoeniX Independence Day Edition OTP email...');

const testHtml = independenceDayOtpTemplate({
  name: 'Prakash Halwai',
  otp: '831956',
  expireMinutes: 10,
  type: 'verification',
  dateString: '15 AUGUST 2026',
});

console.log(`Generated HTML length: ${testHtml.length} characters.`);

// Verifications
const checks = [
  { name: 'Contains OTP digits 831956', pass: testHtml.includes('831956') },
  { name: 'Contains student greeting Prakash Halwai', pass: testHtml.includes('Prakash Halwai') },
  { name: 'Contains DevPhoeniX Technologies LLP', pass: testHtml.includes('DevPhoeniX Technologies LLP') },
  { name: 'Contains Building Intelligent Digital Ecosystems', pass: testHtml.includes('Building Intelligent Digital Ecosystems') },
  { name: 'Contains Happy Independence Day', pass: testHtml.includes('Happy Independence Day') },
  { name: 'Contains 15 AUGUST 2026', pass: testHtml.includes('15 AUGUST 2026') },
  { name: 'Contains Jai Hind', pass: testHtml.includes('Jai Hind') },
  { name: 'Contains Security reminder', pass: testHtml.includes('Security reminder') },
  { name: 'Contains Access DevPhoeniX Assessment CTA', pass: testHtml.includes('Access DevPhoeniX Assessment') },
  { name: 'Contains Official Logo URL', pass: testHtml.includes('https://ai-assessment-beta.vercel.app/logo.png') },
];

let allPassed = true;
checks.forEach(c => {
  if (c.pass) {
    console.log(`✓ ${c.name}`);
  } else {
    console.error(`✕ ${c.name} FAILED!`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\nALL INDEPENDENCE DAY EMAIL TEMPLATE CHECKS PASSED SUCCESSFULLY! 🇮🇳');
} else {
  process.exit(1);
}
