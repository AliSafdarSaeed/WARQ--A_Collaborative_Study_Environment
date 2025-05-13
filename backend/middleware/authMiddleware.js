const jwt = require('jsonwebtoken');
const User = require("../models/userModel");

const handleSupabaseAuth = async (token) => {
  try {
    // Use SUPABASE_JWT_SECRET to verify the token
    const decodedToken = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    if (!decodedToken) {
      console.error("Failed to decode token:", token.substring(0, 20) + "...");
      return { error: new Error("Invalid token format") };
    }
    console.log("Supabase Token decoded:", decodedToken.email);
    if (!decodedToken.sub) {
      console.error("Token missing subject ID");
      return { error: new Error("Invalid token payload") };
    }
    const email = decodedToken.email;
    if (!email) {
      console.error("Token missing email");
      return { error: new Error("Token missing email") };
    }
    let user = await User.findOne({ email });
    if (!user) {
      console.log("Creating new user for email:", email);
      user = await User.create({
        email: email,
        name: decodedToken.user_metadata?.name || email.split('@')[0] || "Supabase User",
        supabaseUid: decodedToken.sub
      });
      console.log("Created user:", user.email);
    } else {
      if (!user.supabaseUid) {
        user.supabaseUid = decodedToken.sub;
        await user.save();
        console.log("Updated existing user with supabaseUid:", user.email);
      }
    }
    return { user, decodedToken };
  } catch (error) {
    console.error("Supabase auth error:", error);
    return { error };
  }
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    console.log("Auth token received (first 20 chars):", token.substring(0, 20) + "...");
    const authResult = await handleSupabaseAuth(token);
    if (authResult.error) {
      console.error("Authentication failed:", authResult.error.message);
      return res.status(401).json({ success: false, message: "Authentication failed" });
    }
    req.user = authResult.user;
    req.token = authResult.decodedToken;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

module.exports = { authenticate };


