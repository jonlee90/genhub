/**
 * Team Invitation Email Helper
 * This file contains the email sending functionality for team invitations.
 * Import this in team.ts to enable email sending.
 */

import { send } from '@/lib/mail';

export async function sendTeamInvitationEmail(
  email: string,
  name: string,
  invitationLink: string,
  inviterName: string = 'A team member',
  companyName: string = 'your company'
): Promise<{ success: boolean; error?: string }> {
  console.log('[TEAM_INVITE] Attempting to send invitation email');
  console.log('[TEAM_INVITE] Recipient:', email);
  console.log('[TEAM_INVITE] Invitation link:', invitationLink);

  // Check if email is configured
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.error('[TEAM_INVITE] Email service not configured');
    console.error('[TEAM_INVITE] MAIL_HOST:', process.env.MAIL_HOST ? 'SET' : 'NOT SET');
    console.error('[TEAM_INVITE] MAIL_USER:', process.env.MAIL_USER ? 'SET' : 'NOT SET');
    console.error('[TEAM_INVITE] MAIL_PASS:', process.env.MAIL_PASS ? 'SET' : 'NOT SET');
    
    return {
      success: false,
      error: 'Email service is not configured. Please configure MAIL_HOST, MAIL_USER, and MAIL_PASS in .env.local',
    };
  }

  try {
    const subject = `You've been invited to join ${companyName} on GenHub`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - GenHub</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background-color: #001B51; 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content { 
      padding: 40px 30px; 
    }
    .content h2 {
      color: #001B51;
      margin-top: 0;
      font-size: 24px;
    }
    .content p {
      margin: 16px 0;
      color: #555;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button { 
      display: inline-block; 
      background-color: #001B51; 
      color: white !important; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #002666;
    }
    .link-box {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      word-break: break-all;
      font-size: 13px;
      color: #666;
      margin: 20px 0;
    }
    .note {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .note p {
      margin: 0;
      color: #856404;
    }
    .footer { 
      text-align: center; 
      padding: 30px; 
      background-color: #f8f9fa;
      color: #666; 
      font-size: 13px;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ GenHub Team Invitation</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>
        <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> 
        on GenHub, a construction project management platform.
      </p>
      
      <p>
        GenHub helps construction teams collaborate on projects, manage tasks, track materials, 
        and communicate effectively.
      </p>
      
      <div class="button-container">
        <a href="${invitationLink}" class="button">Accept Invitation</a>
      </div>
      
      <p style="text-align: center; color: #888; font-size: 14px;">
        Or copy and paste this link into your browser:
      </p>
      <div class="link-box">
        ${invitationLink}
      </div>
      
      <div class="note">
        <p>
          <strong>⏰ Important:</strong> This invitation link will expire in 7 days for security reasons.
        </p>
      </div>
    </div>
    <div class="footer">
      <p>This email was sent by GenHub Construction Management Platform.</p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const textContent = `
Hi ${name},

${inviterName} has invited you to join ${companyName} on GenHub, a construction project management platform.

Click the link below to accept your invitation and create your account:

${invitationLink}

This invitation link will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.

---
GenHub Construction Management Platform
    `.trim();

    await send({
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log('[TEAM_INVITE] Email sent successfully to:', email);
    return { success: true };

  } catch (error) {
    console.error('[TEAM_INVITE] Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TEAM_INVITE] Error details:', errorMessage);
    
    return {
      success: false,
      error: `Failed to send email: ${errorMessage}`,
    };
  }
}
