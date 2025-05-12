// Auth-related routes

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const authController = require("../controllers/authController"); // Auth Controller

// Login route - no longer needed as auth is handled by Supabase on the frontend
router.post("/login", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Please use Supabase authentication in the frontend",
  });
});

// Register route
router.post("/signup", async (req, res) => {
  const { supabaseUid, email, name } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        data: existingUser,
      });
    }

    // Create a new user in MongoDB
    const newUser = new User({ supabaseUid, email, name });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get current user profile
router.get("/me", authenticate, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user, // User is now attached in the authenticate middleware
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/progress", authenticate, authController.getUserProgress);

module.exports = router;

