require('dotenv').config();
const { getTransporter } = require('../lib/notifications');
const transporter = getTransporter();

if (!transporter) {
  console.error('Transporter not created. Check SMTP credentials in .env');
  process.exit(1);
}

console.log('Testing SMTP connection with Gmail...');
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP Verification failed:', err.message);
    process.exit(1);
  } else {
    console.log('✓ SMTP Connection successfully verified with Gmail server!');
    transporter.sendMail({
      from: '"OpticsKhan Eyewear" <' + process.env.SMTP_USER + '>',
      to: process.env.ADMIN_EMAIL,
      subject: '👓 OpticsKhan Store Order Alerts Configured Successfully!',
      html: '<h2>Congratulations!</h2><p>Your Gmail notification system is active. You will receive an instant itemized email alert whenever a customer places an order on your OpticsKhan store via Cash on Delivery.</p><p>Store Helpline: 0324-1383370</p>'
    }, (sendErr, info) => {
      if (sendErr) {
        console.error('❌ Failed to send test email:', sendErr.message);
        process.exit(1);
      } else {
        console.log('🎉 Test email dispatched successfully to ' + process.env.ADMIN_EMAIL + '! Message ID:', info.messageId);
        process.exit(0);
      }
    });
  }
});

