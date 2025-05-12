const { Server } = require("socket.io");

const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust to your frontend's URL in production
      methods: ["GET", "POST"],
    },
  });

  // Track online users and typing status
  const onlineUsers = new Map(); // userId -> socketId
  const typingUsers = new Map(); // projectId: Set<userId>

  io.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    // User joins a project room
    socket.on("joinProject", ({ projectId, userId }) => {
      socket.join(projectId);
      onlineUsers.set(userId, socket.id);
      io.to(projectId).emit("presence:update", { userId, status: "online" });
    });

    // User leaves a project room
    socket.on("leaveProject", ({ projectId, userId }) => {
      socket.leave(projectId);
      onlineUsers.delete(userId);
      io.to(projectId).emit("presence:update", { userId, status: "offline" });
    });

    // Typing indicator
    socket.on("typing", ({ projectId, userId, isTyping }) => {
      if (!typingUsers.has(projectId)) typingUsers.set(projectId, new Set());
      const set = typingUsers.get(projectId);
      if (isTyping) set.add(userId);
      else set.delete(userId);
      io.to(projectId).emit("typing:update", { projectId, typing: Array.from(set) });
    });

    // Real-time chat events
    socket.on("chat:send", (message) => {
      // message: { projectId, ... }
      io.to(message.projectId).emit("chat:new", message);
    });

    socket.on("chat:edit", (message) => {
      io.to(message.projectId).emit("chat:edit", message);
    });

    socket.on("chat:delete", ({ projectId, messageId }) => {
      io.to(projectId).emit("chat:delete", { messageId });
    });

    socket.on("chat:reaction", ({ projectId, messageId, reactions }) => {
      io.to(projectId).emit("chat:reaction", { messageId, reactions });
    });

    socket.on("chat:pin", ({ projectId, messageId, pinned }) => {
      io.to(projectId).emit("chat:pin", { messageId, pinned });
    });

    // Live note editing
    socket.on("note:edit", ({ noteId, projectId, content, userId }) => {
      // Broadcast to all except sender
      socket.to(projectId).emit("note:update", { noteId, content, userId });
    });

    // Presence disconnect
    socket.on("disconnecting", () => {
      // Remove user from all rooms and update presence
      for (const [userId, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(userId);
          // Notify all rooms this user was in
          socket.rooms.forEach((room) => {
            if (room !== socket.id) {
              io.to(room).emit("presence:update", { userId, status: "offline" });
            }
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      // Clean up typing status
      for (const set of typingUsers.values()) {
        for (const userId of set) {
          if (onlineUsers.get(userId) === socket.id) set.delete(userId);
        }
      }
    });

    // Example: Handle custom events
    socket.on("message", (data) => {
      console.log(`📩 Message received: ${data}`);
      io.emit("message", data); // Broadcast to all clients
    });
  });

  return io;
};

module.exports = { initializeSocketIO };
