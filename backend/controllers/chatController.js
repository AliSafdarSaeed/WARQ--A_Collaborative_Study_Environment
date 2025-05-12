const Chat = require("../models/chatModel");
const Project = require("../models/projectModel");
const User = require("../models/userModel");
const { moderateContent } = require("../services/openaiService");
const { sendNotification } = require("../services/notificationService");

// Helper: Check if user is a project member
const isProjectMember = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  return project && project.members.some((id) => id.equals(userId));
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { projectId, channel = "general", content, type = "text", attachments = [], replyTo, mentions = [], pinned = false, pollOptions } = req.body;
    const sender = req.user._id;

    if (!await isProjectMember(sender, projectId)) {
      return res.status(403).json({ success: false, message: "Not a project member" });
    }

    if (await moderateContent(content)) {
      return res.status(400).json({ success: false, message: "Inappropriate content detected" });
    }

    let messageData = {
      projectId, channel, sender, content, type, attachments, replyTo, mentions, pinned
    };

    // Poll support
    if (type === "poll" && Array.isArray(pollOptions)) {
      messageData.poll = { options: pollOptions, votes: [] };
    }

    const message = await Chat.create(messageData);

    // After sending a message, notify mentioned users:
    for (const userId of mentions) {
      const user = await User.findById(userId);
      if (user?.fcmToken) {
        sendNotification(user.fcmToken, "You were mentioned!", content);
      }
    }

    // Real-time: emit via socket if needed
    // req.app.get('io').to(projectId.toString()).emit('chat:new', message);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, attachments } = req.body;
    const userId = req.user._id;
    const message = await Chat.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (!message.sender.equals(userId)) return res.status(403).json({ success: false, message: "No permission to edit" });

    message.content = content;
    if (attachments) message.attachments = attachments;
    await message.save();

    // Real-time: emit via socket
    // req.app.get('io').to(message.projectId.toString()).emit('chat:edit', message);

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to edit message" });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Chat.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (!message.sender.equals(userId)) return res.status(403).json({ success: false, message: "No permission to delete" });

    await message.deleteOne();

    // Real-time: emit via socket
    // req.app.get('io').to(message.projectId.toString()).emit('chat:delete', { messageId });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
};

// React to a message
exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    const message = await Chat.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Toggle reaction
    const existing = message.reactions.find(r => r.emoji === emoji && r.userId.equals(userId));
    if (existing) {
      message.reactions = message.reactions.filter(r => !(r.emoji === emoji && r.userId.equals(userId)));
    } else {
      message.reactions.push({ emoji, userId });
    }
    await message.save();
    // Real-time: emit via socket
    // req.app.get('io').to(message.projectId.toString()).emit('chat:reaction', { messageId, reactions: message.reactions });
    res.status(200).json({ success: true, data: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to react to message" });
  }
};

// Pin/unpin a message
exports.pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Chat.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    const project = await Project.findById(message.projectId);
    const userRole = project.roles.get(req.user._id.toString()) || "member";
    if (userRole !== "admin" && userRole !== "moderator") {
      return res.status(403).json({ success: false, message: "No permission to pin" });
    }

    message.pinned = !message.pinned;
    await message.save();
    // Real-time: emit via socket
    // req.app.get('io').to(message.projectId.toString()).emit('chat:pin', { messageId, pinned: message.pinned });
    res.status(200).json({ success: true, data: { pinned: message.pinned } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to pin/unpin message" });
  }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Chat.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

// Mark as unread
exports.markAsUnread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Chat.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    message.readBy = message.readBy.filter(id => !id.equals(userId));
    await message.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark as unread" });
  }
};

// Vote in a poll
exports.votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;
    const message = await Chat.findById(messageId);
    if (!message || message.type !== "poll" || !message.poll) {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }
    // Remove previous vote
    message.poll.votes = message.poll.votes.filter(v => !v.userId.equals(userId));
    // Add new vote
    message.poll.votes.push({ userId, optionIndex });
    await message.save();
    // Real-time: emit via socket
    // req.app.get('io').to(message.projectId.toString()).emit('chat:pollVote', { messageId, votes: message.poll.votes });
    res.status(200).json({ success: true, data: message.poll.votes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to vote in poll" });
  }
};

// Fetch chat history
exports.getChatHistory = async (req, res) => {
  try {
    const { projectId, channel = "general" } = req.query;
    const userId = req.user._id;
    if (!await isProjectMember(userId, projectId)) {
      return res.status(403).json({ success: false, message: "Not a project member" });
    }
    const messages = await Chat.find({ projectId, channel })
      .sort({ createdAt: 1 })
      .populate("sender", "name")
      .populate("mentions", "name");
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chat history" });
  }
};

// Fetch a single message
exports.getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Chat.findById(messageId)
      .populate("sender", "name")
      .populate("mentions", "name");
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch message" });
  }
};




