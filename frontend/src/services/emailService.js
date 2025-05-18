import { supabase } from '../supabaseClient';
import { getInvitationEmailTemplate, getWelcomeEmailTemplate } from './emailTemplates';

const DEBUG = true;
const debugLog = (...args) => {
  if (DEBUG) console.log('[Email Service Debug]:', ...args);
};

export async function sendEmail({ to, subject, text, html }) {
  debugLog('Preparing email:', { to, subject, text, html });
  try {
    const response = await supabase.functions.invoke('send-email', {
      body: { to, subject, text, html },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (response.error) {
      console.error('Error:', response.error);
      throw response.error;
    }
    debugLog('Email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    debugLog('Full error details:', error);
    throw error;
  }
}

export const sendWelcomeEmail = async ({ toEmail, name }) => {
  debugLog('Preparing welcome email for:', toEmail);
  const html = getWelcomeEmailTemplate({ name });
  const text = `Welcome to WARQ, ${name}! We're excited to have you join our collaborative study environment.`;
  try {
    await sendEmail({ to: toEmail, subject: 'Welcome to WARQ!', text, html });
    debugLog('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendInvitationEmail = async ({ toEmail, fromEmail, groupName, invitationToken }) => {
  debugLog('Preparing invitation email:', { toEmail, fromEmail, groupName, invitationToken });
  if (!toEmail || !fromEmail || !groupName || !invitationToken) throw new Error('Missing required parameters');
  
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://warq-study-platform.vercel.app'
    : window.location.origin;
  const acceptUrl = `${baseUrl}/signup?token=${invitationToken}`;
  const inviterName = fromEmail.split('@')[0];
  const html = getInvitationEmailTemplate({ groupName, inviterName, acceptUrl });
  const text = `You've been invited to join ${groupName} on WARQ by ${inviterName}. Accept here: ${acceptUrl}`;
  
  try {
    await sendEmail({ to: toEmail, subject: 'WARQ Project Invitation', text, html });
    debugLog('Invitation email sent successfully to:', toEmail);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    debugLog('Invitation email error details:', { error: error.message, toEmail });
    throw error;
  }
};