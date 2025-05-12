const User = require('../models/userModel');

exports.notifyWatchers = async (itemId, itemType, title, body) => {
  try {
    const watchers = await User.find({ watched: itemId, watchedModel: itemType });
    for (const user of watchers) {
      // Just log notifications to console instead of using Firebase
      console.log(`NOTIFICATION for ${user.email}: ${title} - ${body}`);
    }
  } catch (error) {
    console.error(`Failed to notify watchers for ${itemType} ${itemId}:`, error.message);
    throw error;
  }
};

exports.sendNotification = async (userId, title, body) => {
  try {
    // Simple console logging instead of Firebase messaging
    console.log(`NOTIFICATION to user ${userId}: ${title} - ${body}`);
  } catch (error) {
    console.error(`Failed to send notification:`, error.message);
    throw error;
  }
};

// Log an event for admin monitoring or analytics
exports.logEvent = async ({ type, message, userId }) => {
  // In production, save to a Notification or Log model, or send to an admin dashboard
  // For now, just log to the console
  console.log(`[Notification] ${type}: ${message} (User: ${userId})`);
};

// Notify a user by userId (helper for project invites, file uploads, etc.)
exports.notifyUserById = async (userId, title, body) => {
  const user = await User.findById(userId);
  if (user) {
    console.log(`NOTIFICATION to user ${user.email}: ${title} - ${body}`);
  }
};

// Generalized notification for different event types
exports.notify = async ({ userId, type, title, body, data }) => {
  const user = await User.findById(userId);
  if (user) {
    console.log(`NOTIFICATION to user ${user.email}: ${title} - ${body}`);
  }
  // Optionally, log or store the notification event
  await exports.logEvent({ type, message: body, userId, data });
};

// Example usage for quiz assignment:
// await notify({ userId, type: 'quiz_assignment', title: 'Quiz Assigned', body: 'A new quiz has been assigned to you.', data: { quizId } });
// Example usage for task update:
// await notify({ userId, type: 'task_update', title: 'Task Updated', body: 'A task you are assigned to has been updated.', data: { taskId } });