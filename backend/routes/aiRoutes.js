const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

router.post("/summary", authenticate, aiController.generateSummary);
router.get("/summary", authenticate, aiController.getSummary);
router.post("/generate", authenticate, aiController.generateAIContent);

module.exports = router;