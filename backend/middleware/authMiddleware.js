const User = require("../models/userModel");
const axios = require("axios");

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // Fetch user info from Supabase
    const { data: supabaseUser } = await axios.get(
      `${process.env.SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
        },
      }
    );

    // Fetch extra fields (like name, bio, avatarUrl) from MongoDB
    let userProfile = await User.findOne({ supabaseUid: supabaseUser.id });
    if (!userProfile) {
      return res.status(401).json({ error: 'User not found in database' });
    }
    req.user = userProfile; // Attach the full MongoDB user document (with _id, etc)
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Supabase token' });
  }
}

module.exports = { authenticate };


