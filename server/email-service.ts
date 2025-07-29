import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email SMTP configuration for Gmail and Google Workspace
const createTransporter = () => {
  const emailUser = process.env.GMAIL_USER;
  
  // Use Gmail SMTP for both regular Gmail and Google Workspace business emails
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate secure reset token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string, 
  resetToken: string, 
  firstName: string = ''
): Promise<void> {
  const transporter = createTransporter();
  
  // Get the base URL from environment or default to localhost
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'TaskScout - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">TaskScout</h1>
          <p style="color: #6B7280; margin: 5px 0;">Maintenance Management Platform</p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; border-radius: 10px; border: 1px solid #E5E7EB;">
          <h2 style="color: #1F2937; margin-top: 0;">Password Reset Request</h2>
          
          ${firstName ? `<p style="color: #374151;">Hello ${firstName},</p>` : '<p style="color: #374151;">Hello,</p>'}
          
          <p style="color: #374151; line-height: 1.5;">
            We received a request to reset your password for your TaskScout account. 
            If you didn't make this request, you can safely ignore this email.
          </p>
          
          <p style="color: #374151; line-height: 1.5;">
            To reset your password, click the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
          
          <p style="color: #6B7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            This link will expire in 15 minutes for security reasons.<br>
            If you continue to have trouble, contact your system administrator.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9CA3AF; font-size: 12px;">
            © ${new Date().getFullYear()} TaskScout. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// Send welcome email to new residential users
export async function sendResidentialWelcomeEmail(
  email: string,
  firstName: string = '',
  lastName: string = ''
): Promise<void> {
  const transporter = createTransporter();
  
  const fullName = `${firstName} ${lastName}`.trim() || 'New User';
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Welcome to TaskScout - Your Maintenance Management Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0; font-size: 32px;">Welcome to TaskScout!</h1>
          <p style="color: #6B7280; margin: 5px 0; font-size: 16px;">Your Maintenance Management Platform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Hello ${fullName}!</h2>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">
            Thank you for joining TaskScout. We're excited to help you manage your home maintenance needs!
          </p>
        </div>
        
        <div style="background: #F9FAFB; padding: 25px; border-radius: 10px; border: 1px solid #E5E7EB; margin-bottom: 25px;">
          <h3 style="color: #1F2937; margin-top: 0; font-size: 18px;">🏠 What You Can Do:</h3>
          <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><strong>Create Maintenance Tickets:</strong> Submit requests for plumbing, electrical, HVAC, and general repairs</li>
            <li><strong>Upload Photos & Videos:</strong> Show vendors exactly what needs to be fixed</li>
            <li><strong>Get Multiple Bids:</strong> Your tickets automatically go to our marketplace for competitive bidding</li>
            <li><strong>Track Progress:</strong> Monitor your requests from submission to completion</li>
            <li><strong>Secure Payments:</strong> Pay vendors safely through our platform</li>
          </ul>
        </div>
        
        <div style="background: #FEF3C7; padding: 20px; border-radius: 10px; border: 1px solid #F59E0B; margin-bottom: 25px;">
          <h3 style="color: #92400E; margin-top: 0; font-size: 16px;">💡 Getting Started Tips:</h3>
          <ol style="color: #92400E; line-height: 1.5; margin: 0; padding-left: 20px;">
            <li>Log in to your account and explore the dashboard</li>
            <li>Create your first maintenance ticket with detailed descriptions</li>
            <li>Upload clear photos or videos of the issue</li>
            <li>Review and accept bids from qualified vendors</li>
            <li>Rate your experience to help other users</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL || 'http://localhost:5000'}/login" 
             style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin-top: 0; font-size: 16px;">📞 Need Help?</h3>
          <p style="color: #6B7280; line-height: 1.5; margin: 0;">
            Our support team is here to help! If you have any questions about using TaskScout or need assistance with your first maintenance request, don't hesitate to reach out.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} TaskScout. All rights reserved.<br>
            Making home maintenance simple and reliable.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    
    // For debugging purposes, log the email content that would have been sent
    console.log('\n🔍 EMAIL DEBUG - Welcome email that would have been sent:');
    console.log('To:', email);
    console.log('Subject:', mailOptions.subject);
    console.log('Content preview:', `Welcome ${fullName}! Your TaskScout account is ready.`);
    console.log('Registration is successful, but email delivery failed due to SMTP configuration.\n');
    
    // Don't throw error - allow registration to complete
    console.log('⚠️  Registration completed successfully despite email delivery issue');
  }
}

// Send password reset confirmation email
export async function sendPasswordResetConfirmationEmail(
  email: string, 
  firstName: string = ''
): Promise<void> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'TaskScout - Password Reset Successful',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">TaskScout</h1>
          <p style="color: #6B7280; margin: 5px 0;">Maintenance Management Platform</p>
        </div>
        
        <div style="background: #F0FDF4; padding: 30px; border-radius: 10px; border: 1px solid #BBFAB1;">
          <h2 style="color: #16A34A; margin-top: 0;">Password Reset Successful</h2>
          
          ${firstName ? `<p style="color: #374151;">Hello ${firstName},</p>` : '<p style="color: #374151;">Hello,</p>'}
          
          <p style="color: #374151; line-height: 1.5;">
            Your password has been successfully reset. You can now log in to your TaskScout account with your new password.
          </p>
          
          <p style="color: #374151; line-height: 1.5;">
            If you didn't make this change, please contact your system administrator immediately.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/login" 
               style="background: #16A34A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Login to TaskScout
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9CA3AF; font-size: 12px;">
            © ${new Date().getFullYear()} TaskScout. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error for confirmation emails
  }
}