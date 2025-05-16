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
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project",
    required: function() {
      return this.isNew && !this._id;
    }
  },
  tags: [String],
  summary: String, 
  files: [fileSchema], // Use the file schema for the files array
}, { timestamps: true, collection: "notes" });

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
