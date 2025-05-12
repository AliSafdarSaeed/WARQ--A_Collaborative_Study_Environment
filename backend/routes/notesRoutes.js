const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const notesController = require("../controllers/notesController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Save to /uploads

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
