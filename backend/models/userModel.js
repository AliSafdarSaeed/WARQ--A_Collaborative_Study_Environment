const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  supabaseUid: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Explicitly define the index we want
userSchema.index({ supabaseUid: 1 }, { unique: true });

// Create the model
const User = mongoose.model("User", userSchema);

// Export model
module.exports = User;

