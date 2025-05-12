const Note = require("../models/noteModel");
const Quiz = require("../models/quizModel");
const { sendNotification, notifyWatchers } = require("../services/notificationService");
const User = require("../models/userModel");
const path = require("path");

exports.createNote = async (req, res) => {
  try {
    const { title, content, projectId, tags } = req.body;
    const note = await Note.create({
      title,
      content,
      projectId,
      tags,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ success: false, message: "Failed to create note" });
  }
};

exports.getUserNotes = async (req, res) => {
  try {
    // Optionally filter by projectId: req.query.projectId
    const filter = { createdBy: req.user._id };
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }
    const notes = await Note.find(filter).populate("projectId", "title");
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notes" });
  }
};

exports.editNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, title, tags } = req.body;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    await note.save();
    await notifyWatchers(note._id, "Note", "A note you are watching was updated.", note.title);
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to edit note" });
  }
};

exports.markNoteCompleted = async (req, res) => {
  try {
    const { noteId } = req.body;
    const user = req.user;
    if (!user.progress) user.progress = { notesCompleted: [], quizzesCompleted: [], studyTime: 0 };
    if (!user.progress.notesCompleted.includes(noteId)) {
      user.progress.notesCompleted.push(noteId);
      await user.save();
    }
    res.status(200).json({ success: true, data: user.progress });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark note as completed" });
  }
};

exports.addFileToNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { url, type, name } = req.body;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    if (!note.files) note.files = [];
    note.files.push({ url, type, name });
    await note.save();
    await notifyWatchers(note._id, "Note", "New file uploaded", `A new file was added to \"${note.title}\".`);
    res.status(200).json({ success: true, data: note });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to add file" });
  }
};

// Create a quiz (AI-generated or manual) and notify assigned users
exports.createQuiz = async (req, res) => {
  try {
    const { noteId, questions, assignedTo = [] } = req.body;
    const quiz = await Quiz.create({
      noteId,
      questions,
      createdBy: req.user._id
    });

    // Notify assigned users (push notification)
    for (const userId of assignedTo) {
      const user = await User.findById(userId);
      if (user?.fcmToken) {
        sendNotification(
          user.fcmToken,
          "New Quiz Assigned",
          "A new quiz has been assigned to you."
        );
      }
    }

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create quiz" });
  }
};

// Fetch quizzes for a note
exports.getQuizzesForNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const quizzes = await Quiz.find({ noteId });
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch quizzes" });
  }
};

// Submit quiz answers and update progress
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    // Optionally, check answers and calculate score here
    // Update user progress
    if (!req.user.progress.quizzesCompleted.includes(quizId)) {
      req.user.progress.quizzesCompleted.push(quizId);
      await req.user.save();
    }
    res.status(200).json({ success: true, message: "Quiz submitted", data: { quizId, answers } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to submit quiz" });
  }
};

exports.subscribeToNote = async (req, res) => {
  try {
    const { noteId } = req.body;
    const user = req.user;
    if (!user.watched.includes(noteId)) {
      user.watched.push(noteId);
      user.watchedModel = "Note";
      await user.save();
    }
    res.status(200).json({ success: true, message: "Subscribed to note" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to subscribe to note" });
  }
};

exports.unsubscribeFromNote = async (req, res) => {
  try {
    const { noteId } = req.body;
    const user = req.user;
    user.watched = user.watched.filter(id => !id.equals(noteId));
    await user.save();
    res.status(200).json({ success: true, message: "Unsubscribed from note" });
  } catch (error) {
    res.status (500).json({ success: false, message: "Failed to unsubscribe from note" });
  }
};

exports.editNoteViaPost = async (req, res) => {
  try {
    const { noteId, content, title, tags } = req.body;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    await note.save();
    await notifyWatchers(note._id, "Note", "A note you are watching was updated.", note.title);
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to edit note" });
  }
};

exports.uploadFileViaPost = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { noteId, url, name, type, size, delete: shouldDelete } = req.body;
    
    if (!noteId || !url) {
      return res.status(400).json({ success: false, message: "Missing required fields: noteId or url" });
    }
    
    console.log(`Finding note with ID: ${noteId}`);
    const note = await Note.findById(noteId);
    
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    
    // Initialize files array if it doesn't exist
    if (!note.files) {
      note.files = [];
    }
    
    if (shouldDelete) {
      console.log(`Deleting file with URL: ${url}`);
      // Filter out the file with the matching URL
      note.files = note.files.filter(file => file.url !== url);
    } else {
      console.log(`Adding file: ${name}, type: ${type}, size: ${size}`);
      
      // Create a new file object using the schema
      const newFile = {
        url: url,
        name: name || 'Unnamed file',
        type: type || 'application/octet-stream',
        size: size || 0,
        uploadedAt: new Date()
      };
      
      // Add the file to the files array
      note.files.push(newFile);
    }
    
    console.log("Saving note...");
    await note.save();
    
    console.log("Note saved successfully");
    res.status(200).json({ success: true, data: note });
  } catch (e) {
    console.error("Error in uploadFileViaPost:", e);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update files", 
      error: e.message,
      stack: e.stack
    });
  }
};

exports.uploadFileFromDevice = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { noteId } = req.body;
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const note = await Note.findById(noteId);
    if (!note) {
      console.error("Note not found:", noteId);
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    if (!note.files) note.files = [];
    note.files.push({
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype,
      name: req.file.originalname
    });
    await note.save();
    console.log("File uploaded and saved to note:", note._id);

    res.status(200).json({ success: true, data: note });
  } catch (e) {
    console.error("Upload error:", e);
    res.status(500).json({ success: false, message: "Failed to upload file from device" });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    console.error("Error fetching note by ID:", err);
    res.status(500).json({ success: false, message: "Failed to fetch note" });
  }
};
