const mongoose = require("mongoose");

// Define the file schema as a separate schema
const fileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String },
  type: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now }
});

// Define the note schema
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project",
    // Make projectId optional for file uploads
    required: function() {
      // Only require projectId for new notes, not for file uploads to existing notes
      return this.isNew && !this._id;
    }
  },
  tags: [String],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: function() {
      // Only require createdBy for new notes, not for file uploads to existing notes
      return this.isNew && !this._id;
    }
  },
  summary: String, 
  files: [fileSchema], // Use the file schema for the files array
  createdAt: { type: Date, default: Date.now },
}, { collection: "notes" });

// Validate files field on save
noteSchema.pre('save', function(next) {
  if (this.files && !Array.isArray(this.files)) {
    throw new Error("files must be an array");
  }
  this.files = this.files || [];
  next();
});

console.log("Registering Note model with files as array of file schema objects");
const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
