import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Gmail SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
    },
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