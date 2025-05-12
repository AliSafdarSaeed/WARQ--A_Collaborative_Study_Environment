const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: false });

const pollVoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  optionIndex: { type: Number, required: true }
}, { _id: false });

const pollSchema = new mongoose.Schema({
  options: [{ type: String, required: true }],
  votes: [pollVoteSchema]
}, { _id: false });

const messageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  channel: { type: String, default: 'general' }, // e.g., #general, #resources
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  type: { type: String, enum: ['text', 'image', 'file', 'code', 'poll', 'ai'], default: 'text' },
  attachments: [{ url: String, type: String }],
  files: [{ url: String, type: String, name: String }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }, // for threads
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [reactionSchema],
  pinned: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  poll: pollSchema,
  createdAt: { type: Date, default: Date.now }
});

poll: pollSchema,

module.exports = mongoose.model('Chat', messageSchema);

