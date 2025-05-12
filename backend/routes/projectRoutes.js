const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const projectController = require("../controllers/projectController");

// Create a new project
router.post("/", authenticate, projectController.createProject);

// Get all projects for the authenticated user
router.get("/", authenticate, projectController.getUserProjects);

// Join a project
router.post("/join", authenticate, projectController.joinProject);

// Set role in a project
router.post("/set-role", authenticate, projectController.setRole);

// Invite to Project
router.post("/invite", authenticate, projectController.inviteToProject);

module.exports = router;

