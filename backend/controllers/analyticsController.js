const Analytics = require('../models/Analytics');
const notificationService = require('../services/notificationService');
const openAIService = require('../services/openaiService');
const mongoose = require('mongoose');

// Track user activity (e.g., viewing a note, editing a project)
exports.trackActivity = async (req, res) => {
  try {
    const { userId, projectId, noteId, action, duration } = req.body;
    if (!userId || !action) {
      return res.status(400).json({ error: 'userId and action are required' });
    }
    const analytics = new Analytics({
      userId,
      projectId: projectId || null,
      noteId: noteId || null,
      action,
      duration: duration || 0,
    });
    await analytics.save();
    // Notify via notificationService (e.g., log event for admin monitoring)
    if (notificationService.logEvent) {
      await notificationService.logEvent({
        type: 'activity',
        message: `User ${userId} performed ${action} on ${projectId || noteId || 'platform'}`,
        userId,
      });
    }
    // Optional: Use openAIService for AI-driven insights
    if (openAIService.analyzeActivity) {
      const aiInsight = await openAIService.analyzeActivity({
        userId,
        action,
        duration,
        projectId,
        noteId,
      });
      if (aiInsight) {
        analytics.metadata = aiInsight;
        await analytics.save();
      }
    }
    res.status(201).json({ message: 'Activity tracked successfully', analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get analytics for a user (e.g., time spent, most active users)
exports.getAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const analytics = await Analytics.find({ userId })
      .populate('projectId', 'title')
      .populate('noteId', 'title');
    // Aggregate time spent per project
    const timePerProject = await Analytics.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), projectId: { $ne: null } } },
      { $group: { _id: '$projectId', totalTime: { $sum: '$duration' } } },
      { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      { $project: { projectTitle: '$project.title', totalTime: 1 } },
    ]);
    // Aggregate time spent per note
    const timePerNote = await Analytics.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), noteId: { $ne: null } } },
      { $group: { _id: '$noteId', totalTime: { $sum: '$duration' } } },
      { $lookup: { from: 'notes', localField: '_id', foreignField: '_id', as: 'note' } },
      { $unwind: '$note' },
      { $project: { noteTitle: '$note.title', totalTime: 1 } },
    ]);
    // Identify most active users (platform-wide)
    const mostActiveUsers = await Analytics.aggregate([
      { $group: { _id: '$userId', totalActions: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.name', totalActions: 1 } },
      { $sort: { totalActions: -1 } },
      { $limit: 5 },
    ]);
    // Use openAIService to predict study patterns
    let aiInsights = null;
    if (openAIService.predictStudyPatterns) {
      aiInsights = await openAIService.predictStudyPatterns({ userId, analytics });
    }
    res.json({
      analytics,
      timePerProject,
      timePerNote,
      mostActiveUsers,
      aiInsights,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
