const mongoose = require("mongoose");

// User schema
const userSchema = new mongoose.Schema({
  supabaseUid: { 
    type: String,
    required: true
  },
  email: { type: String, required: [true, "Please provide an email"], unique: true },
  name: { type: String, required: [true, "Please provide a name"] },
  createdAt: { type: Date, default: Date.now },
  fcmToken: { type: String },
  progress: {
    type: Object,
    default: {
      notesCompleted: [],
      quizzesCompleted: [],
      studyTime: 0 // in minutes
    }
  },
  watched: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'watchedModel'
  }],
  watchedModel: {
    type: String,
    enum: ['Note', 'Project'],
    default: 'Note'
  }
});

module.exports = mongoose.model("User", userSchema);
