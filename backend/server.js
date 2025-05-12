require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { initializeSocketIO } = require("./services/socketService");
const connectDB = require("./config/mongodbConfig");

// Initialize Express
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB(); // No callback needed

// Initialize Socket.IO
const io = initializeSocketIO(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/notes", require("./routes/notesRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use("/uploads", express.static("uploads"));

// Base route
app.get("/", (req, res) => {
  res.send("Student Collaborative Study Platform API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start the server
const PORT = process.env.PORT || 5001;  // Changed from 5000 to 5001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
