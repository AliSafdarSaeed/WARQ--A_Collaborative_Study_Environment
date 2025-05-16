const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const notesController = require("../controllers/notesController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Save to /uploads
const Note = require("../models/noteModel");

// Special error handler for upload-file route
router.post("/upload-file", authenticate, async (req, res) => {
  try {
    console.log("=== UPLOAD FILE ROUTE ===");
    console.log("Request body:", req.body);
    console.log("User:", req.user ? req.user.email : "No user");
    
    // Call the actual controller with error handling
    await notesController.uploadFileViaPost(req, res);
  } catch (error) {
    console.error("ERROR in upload-file route:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error in upload-file route",
      error: error.message
    });
  }
});

// Get all notes for current user - improved version with better error handling
router.get("/all", authenticate, async (req, res) => {
  try {
    // Verify we have a user ID
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        error: "User not authenticated properly", 
        success: false 
      });
    }
    
    // Get all notes for this user, sorted by most recent first
    const notes = await Note.find({ user: req.user._id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select('-__v')  // Exclude version field
      .lean();  // Return plain objects instead of Mongoose docs for better performance
    
    // Log success for debugging
    console.log(`Fetched ${notes.length} notes for user: ${req.user._id}`);
    
    // Return the notes
    res.json(notes);
  } catch (err) {
    console.error("Error fetching user notes:", err);
    res.status(500).json({ 
      error: "Failed to fetch notes",
      message: err.message,
      success: false
    });
  }
});

// Create or update (auto-save) a note - enhanced with better error handling
router.post("/save", authenticate, async (req, res) => {
  try {
    const { noteId, title, content } = req.body;
    
    // Input validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    let note;
    
    if (noteId) {
      // Update existing note
      note = await Note.findOneAndUpdate(
        { _id: noteId, user: req.user._id },
        { 
          title, 
          content,
          updatedAt: new Date() // Explicitly update the timestamp
        },
        { new: true, runValidators: true }
      );
      
      if (!note) {
        return res.status(404).json({ error: "Note not found or you don't have permission to edit it" });
      }
    } else {
      // Create new note
      note = await Note.create({ 
        title, 
        content, 
        user: req.user._id
      });
    }
    
    res.json(note);
  } catch (err) {
    console.error("Note save error:", err);
    res.status(500).json({ 
      error: "Failed to save note",
      message: err.message
    });
  }
});

// Delete a note
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Note.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Regular routes
router.post("/", authenticate, notesController.createNote);
router.get("/", authenticate, notesController.getUserNotes);
router.post("/complete", authenticate, notesController.markNoteCompleted);
router.post("/:noteId/files", authenticate, notesController.addFileToNote);
router.put("/:noteId", authenticate, notesController.editNote);
router.get("/:noteId", authenticate, notesController.getNoteById);
router.post("/quiz", authenticate, notesController.createQuiz);
router.get("/:noteId/quizzes", authenticate, notesController.getQuizzesForNote);
router.post("/quiz/submit", authenticate, notesController.submitQuiz);
router.post("/subscribe", authenticate, notesController.subscribeToNote);
router.post("/unsubscribe", authenticate, notesController.unsubscribeFromNote);
router.post("/edit", authenticate, notesController.editNoteViaPost);

module.exports = router;
