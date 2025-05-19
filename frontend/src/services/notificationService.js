import { supabase } from './supabase';

/**
 * Send a notification to a user.
 * @param {Object} opts
 * @param {string} opts.userId - UUID of the user to notify
 * @param {string} opts.type - Notification type (e.g. 'invite', 'role_change', etc.)
 * @param {string} opts.message - Main message
 * @param {string} [opts.projectId] - Project UUID (optional)
 * @param {string} [opts.severity] - 'info' | 'warning' | 'danger' | etc.
 */
export async function sendNotification({ userId, type, message, projectId = null, severity = 'info' }) {
  if (!userId || !type || !message) return;
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      message,
      project_id: projectId === '' ? null : projectId, // Ensure empty string is stored as null
      severity,
      is_read: false
    });
    if (error) {
      console.error('Failed to send notification:', error.message);
    }
  } catch (err) {
    console.error('Unexpected error sending notification:', err);
  }
}