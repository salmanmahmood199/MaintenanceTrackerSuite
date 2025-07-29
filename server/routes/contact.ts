import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email configuration using existing Gmail credentials
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Handle free trial contact form submission
router.post('/trial-request', async (req, res) => {
  try {
    const { name, email, phone, company, website, companySize, useCase, details } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !company || !companySize || !useCase) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create email content
    const emailSubject = `New TaskScout Free Trial Request - ${company}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #7C3AED); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">New Free Trial Request</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e293b; margin-top: 0;">Contact Information</h2>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Name:</td>
              <td style="padding: 8px 0; color: #1e293b;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
              <td style="padding: 8px 0; color: #1e293b;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone:</td>
              <td style="padding: 8px 0; color: #1e293b;">${phone}</td>
            </tr>
          </table>

          <h2 style="color: #1e293b;">Company Information</h2>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company:</td>
              <td style="padding: 8px 0; color: #1e293b;">${company}</td>
            </tr>
            ${website ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Website:</td>
              <td style="padding: 8px 0; color: #1e293b;"><a href="${website}" style="color: #3B82F6;">${website}</a></td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company Size:</td>
              <td style="padding: 8px 0; color: #1e293b;">${companySize}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Use Case:</td>
              <td style="padding: 8px 0; color: #1e293b;">${useCase}</td>
            </tr>
          </table>

          ${details ? `
          <h2 style="color: #1e293b;">Additional Details</h2>
          <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #3B82F6;">
            <p style="margin: 0; color: #1e293b; line-height: 1.6;">${details}</p>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 5px; border: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin-top: 0;">Next Steps</h3>
            <ul style="color: #475569; line-height: 1.6;">
              <li>Respond within 24 hours to confirm trial setup</li>
              <li>Schedule personalized onboarding session</li>
              <li>Create trial account with custom configuration</li>
              <li>Provide mobile app access credentials</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>This request was submitted through the TaskScout website contact form.</p>
          <p>TaskScout - Property Maintenance Management Platform</p>
        </div>
      </div>
    `;

    // Send email to TaskScout team
    await transporter.sendMail({
      from: `"TaskScout Contact Form" <${process.env.GMAIL_USER}>`,
      to: 'hello@taskscout.ai',
      subject: emailSubject,
      html: emailHtml
    });

    // Send confirmation email to user
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #7C3AED); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Thank You for Your Interest!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
            Thank you for requesting a free trial of TaskScout! We're excited to show you how our platform can transform your property maintenance operations.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #1e293b; margin-top: 0;">What happens next?</h3>
            <ul style="color: #475569; line-height: 1.8;">
              <li><strong>Within 24 hours:</strong> Our team will review your request and contact you</li>
              <li><strong>Trial Setup:</strong> We'll create your personalized TaskScout account</li>
              <li><strong>Onboarding:</strong> Schedule a 30-minute demo tailored to your needs</li>
              <li><strong>Full Access:</strong> 14-day trial with all features unlocked</li>
            </ul>
          </div>

          <div style="background: linear-gradient(135deg, #EEF2FF, #F3E8FF); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Your Trial Includes:</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="color: #475569;">✓ Web dashboard access</div>
              <div style="color: #475569;">✓ Mobile app (iOS & Android)</div>
              <div style="color: #475569;">✓ Vendor marketplace</div>
              <div style="color: #475569;">✓ Calendar integration</div>
              <div style="color: #475569;">✓ Billing & payments</div>
              <div style="color: #475569;">✓ Analytics & reporting</div>
            </div>
          </div>

          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
            If you have any immediate questions, feel free to reply to this email or contact us directly at 
            <a href="mailto:hello@taskscout.ai" style="color: #3B82F6;">hello@taskscout.ai</a>.
          </p>

          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The TaskScout Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>TaskScout - Revolutionizing Property Maintenance Management</p>
          <p>Serving the Washington DC Metro Area</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"TaskScout Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your TaskScout Free Trial Request - We\'ll Be In Touch Soon!',
      html: confirmationHtml
    });

    res.status(200).json({ 
      success: true, 
      message: 'Trial request submitted successfully' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to submit trial request. Please try again.' 
    });
  }
});

export default router;