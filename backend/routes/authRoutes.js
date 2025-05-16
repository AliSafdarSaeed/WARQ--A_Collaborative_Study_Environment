// Auth-related routes
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const jwt = require('jsonwebtoken');
const authController = require("../controllers/authController");
const bcrypt = require('bcrypt');
const { supabaseAuth } = require('../controllers/authController');

// Login route - support both token and password auth methods
router.post("/login", async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ success: false, message: "Email and token are required" });
    }

    // Decode Supabase token
    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.sub) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Find user in MongoDB by supabaseUid
    let user = await User.findOne({ supabaseUid: decodedToken.sub });

    // If user doesn't exist, create a new user
    if (!user) {
      user = await User.create({
        supabaseUid: decodedToken.sub,
        email,
        name: email.split('@')[0] // Fallback name
      });
    }

    // Generate JWT token for the user
    const responseToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'default_secret_replace_in_production',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name
        },
        token: responseToken
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// Register route - store Supabase user in MongoDB
router.post("/signup", async (req, res) => {
  try {
    const { email, username, password, token } = req.body;
    
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
        data: { 
          user: {
            _id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name
          }
        },
      });
    }
    
    // Create a new user in MongoDB
    const newUser = new User({
      email,
      name: username || email.split('@')[0],
      supabaseUid
    });

    // Hash and store password if provided
    if (password) {
      newUser.password = await bcrypt.hash(password, 10);
    }
    
    await newUser.save();
    
    // Generate JWT token for the user
    const responseToken = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'default_secret_replace_in_production',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { 
        user: {
          _id: newUser._id,
          email: newUser.email,
          name: newUser.name
        }, 
        token: responseToken || token
      }
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

// Pending signup route - create a user without Supabase UID
// router.post("/pending-signup", async (req, res) => {
//   try {
//     const { email, username } = req.body;
//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }
//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(200).json({
//         success: true,
//         message: "User already exists",
//         data: {
//           user: {
//             _id: existingUser._id,
//             email: existingUser.email,
//             name: existingUser.name
//           }
//         },
//       });
//     }
//     // Create a pending user (no supabaseUid)
//     const newUser = new User({
//       email,
//       name: username || email.split('@')[0],
//       supabaseUid: undefined
//     });
//     await newUser.save();
//     res.status(201).json({
//       success: true,
//       message: "Pending user created",
//       data: {
//         user: {
//           _id: newUser._id,
//           email: newUser.email,
//           name: newUser.name
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error during pending signup:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create pending user",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// });

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

// Save FCM token for push notifications
router.post("/fcm-token", authenticate, authController.saveFcmToken);

// Get user progress
router.get("/progress", authenticate, authController.getUserProgress);

// Update user profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = req.user;
    
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Save or update app-specific user profile (name, bio, avatarUrl) after Supabase signup
router.post('/app-profile', authenticate, async (req, res) => {
  const { supabaseUid, name } = req.body;

  if (!supabaseUid || !name) {
    return res.status(400).json({ success: false, message: "supabaseUid and name are required" });
  }

  try {
    // Upsert user in MongoDB
    let user = await User.findOneAndUpdate(
      { supabaseUid },
      { name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error saving user profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Supabase signup info to MongoDB
router.post('/supabase-signup', async (req, res) => {
  const { email, id, name } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        supabaseUid: id,
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

