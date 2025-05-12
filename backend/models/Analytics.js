const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    default: null,
  },
  action: {
    type: String,
    enum: ['view', 'edit', 'complete', 'quiz_submit'],
    required: true,
  },
  duration: {
    type: Number,
    default: 0, // Time in seconds
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Map,
    of: String, // For additional AI-driven insights
  },
});

module.exports = mongoose.model('Analytics', analyticsSchema);
