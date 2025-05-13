// Auth-related routes
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const jwt = require('jsonwebtoken');
const authController = require("../controllers/authController");

// Login route - validate Supabase token and return MongoDB user info
router.post("/login", async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: "Email and token are required",
      });
    }
    
    // Verify the token is valid (basic validation)
    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    
    // Find or create the user in MongoDB
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user in MongoDB if they don't exist
      user = new User({
        email,
        supabaseUid: decodedToken.sub,
        name: decodedToken.user_metadata?.name || email.split('@')[0]
      });
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Register route - store Supabase user in MongoDB
router.post("/signup", async (req, res) => {
  try {
    const { email, username, token } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    
    // Decode the Supabase token if provided
    let supabaseUid = null;
    if (token) {
      const decodedToken = jwt.decode(token);
      supabaseUid = decodedToken?.sub;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        data: existingUser,
      });
    }
    
    // Create a new user in MongoDB
    const newUser = new User({
      email,
      name: username || email.split('@')[0],
      supabaseUid
    });
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: newUser, token }
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

