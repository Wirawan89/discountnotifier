const nodemailer = require('nodemailer');

// Email transporter configuration (same as in the main app)
const createTransporter = () => {
  // Gmail configuration
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }
  
  // SendGrid configuration
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }
  
  // Resend configuration
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransporter({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }
  
  // Default to Gmail
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password',
    },
  });
};

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
  console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? 'Set' : 'Not set'}`);
  console.log(`GMAIL_PASS: ${process.env.GMAIL_PASS ? 'Set' : 'Not set'}`);
  console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Set' : 'Not set'}\n`);

  // Create transporter
  const transporter = createTransporter();
  console.log('📧 Email transporter created successfully\n');

  // Test email content
  const testEmailContent = {
    subject: '🧪 DiscountNotifier Email Test',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 28px;">🛍️ DiscountNotifier</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Email Test</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Email Configuration Test</h2>
            
            <p style="color: #374151; margin-bottom: 20px;">
              This is a test email to verify that your email configuration is working correctly.
            </p>
            
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #0c4a6e; margin: 0 0 15px 0;">✅ Test Results</h3>
              <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
                <li>Email transporter created successfully</li>
                <li>Email sent successfully</li>
                <li>Configuration is working properly</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">
                If you received this email, your DiscountNotifier email configuration is working correctly!
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // Get test email from command line argument or use default
  const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
  
  if (!testEmail || testEmail === 'test@example.com') {
    console.log('⚠️  No test email provided. Please provide an email address as an argument:');
    console.log('   node scripts/test-email.js your-email@example.com\n');
    console.log('   Or set TEST_EMAIL environment variable.\n');
    return;
  }

  console.log(`📤 Sending test email to: ${testEmail}\n`);

  try {
    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@discountnotifier.com',
      to: testEmail,
      subject: testEmailContent.subject,
      html: testEmailContent.html,
    });

    console.log('✅ Email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📤 From: ${info.from}`);
    console.log(`📥 To: ${info.to}`);
    console.log(`📋 Subject: ${testEmailContent.subject}\n`);
    
    console.log('🎉 Email configuration is working correctly!');
    console.log('   You can now use email notifications in your DiscountNotifier application.\n');

  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Authentication Error:');
      console.log('   - Check your email credentials');
      console.log('   - For Gmail: Ensure 2FA is enabled and use app password');
      console.log('   - For SendGrid: Verify your API key and sender email');
      console.log('   - For Resend: Check your API key and domain verification');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection Error:');
      console.log('   - Check your internet connection');
      console.log('   - Verify email provider settings');
    }
    
    console.log('\n📖 For more help, see EMAIL_SETUP.md');
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run the test
testEmail().catch(console.error);
