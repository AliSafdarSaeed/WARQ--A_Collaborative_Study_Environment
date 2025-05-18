import { supabase } from '../supabaseClient';

const DEBUG = true;
const debugLog = (...args) => {
  if (DEBUG) console.log('[Email Service Debug]:', ...args);
};

async function sendEmail(to, subject, text, html) {
  debugLog('Starting to send email with data:', { to, subject });
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: JSON.stringify({ to, subject, text, html }),
    });
    if (error) throw error;
    debugLog('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    debugLog('Full error details:', { error: error.message, to });
    throw error;
  }
}

export const sendWelcomeEmail = async ({ toEmail, name }) => {
  debugLog('Preparing welcome email for:', toEmail);
  const dashboardUrl = `${window.location.origin}/dashboard`;
  
  const template = {
    subject: 'Welcome to WARQ!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2C3E50;">Welcome to WARQ!</h1>
        <p>Hello ${name},</p>
        <p>Welcome to WARQ - your new collaborative study environment! We're excited to have you join our community.</p>
        <p>With WARQ, you can:</p>
        <ul>
          <li>Create and organize your study notes</li>
          <li>Collaborate with study groups</li>
          <li>Use AI-powered study assistance</li>
          <li>Chat with group members in real-time</li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #3498DB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Get Started</a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy studying!</p>
        <p>The WARQ Team</p>
      </div>
    `,
    text: `Welcome to WARQ, ${name}!

We're excited to have you join our collaborative study environment.

With WARQ, you can:
- Create and organize your study notes
- Collaborate with study groups
- Use AI-powered study assistance
- Chat with group members in real-time

Visit ${dashboardUrl} to get started.

Happy studying!
The WARQ Team`
  };

  try {
    await sendEmail(toEmail, template.subject, template.text, template.html);
    debugLog('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendInvitationEmail = async ({ toEmail, fromEmail, groupName, invitationToken }) => {
  debugLog('Preparing invitation email:', { toEmail, fromEmail, groupName, invitationToken });
  if (!toEmail || !fromEmail || !groupName || !invitationToken) throw new Error('Missing required parameters');
  
  const acceptUrl = `${window.location.origin}/accept-invitation?token=${invitationToken}`;
  const inviterName = fromEmail.split('@')[0];
  
  const template = {
    subject: `You've been invited to join ${groupName} on WARQ`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2C3E50;">Join ${groupName} on WARQ</h1>
        <p>Hello!</p>
        <p>${inviterName} (${fromEmail}) has invited you to join their study group "${groupName}" on WARQ.</p>
        <p>WARQ is a collaborative study environment where you can:</p>
        <ul>
          <li>Share and collaborate on study notes</li>
          <li>Participate in group discussions</li>
          <li>Use AI-powered study tools together</li>
          <li>Chat with group members</li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="${acceptUrl}" style="background-color: #3498DB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        </div>
        <p>This invitation link will expire in 24 hours.</p>
        <p>We hope to see you in the group!</p>
        <p>The WARQ Team</p>
      </div>
    `,
    text: `You've been invited to join ${groupName} on WARQ!

${inviterName} (${fromEmail}) has invited you to join their study group "${groupName}".

WARQ is a collaborative study environment where you can:
- Share and collaborate on study notes
- Participate in group discussions
- Use AI-powered study tools together
- Chat with group members

Visit ${acceptUrl} to accept the invitation.
Note: This invitation link will expire in 24 hours.

We hope to see you in the group!
The WARQ Team`
  };

  try {
    await sendEmail(toEmail, template.subject, template.text, template.html);
    debugLog('Invitation email sent successfully to:', toEmail);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    debugLog('Invitation email error details:', { error: error.message, toEmail });
    throw error;
  }
}; 