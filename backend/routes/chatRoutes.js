const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

router.post("/", authenticate, chatController.sendMessage);
router.get("/", authenticate, chatController.getChatHistory);
router.get("/:messageId", authenticate, chatController.getMessage);
router.put("/:messageId", authenticate, chatController.editMessage);
router.delete("/:messageId", authenticate, chatController.deleteMessage);
router.post("/:messageId/react", authenticate, chatController.reactToMessage);
router.post("/:messageId/pin", authenticate, chatController.pinMessage);
router.post("/:messageId/read", authenticate, chatController.markAsRead);
router.post("/:messageId/unread", authenticate, chatController.markAsUnread);
router.post("/:messageId/vote", authenticate, chatController.votePoll);

module.exports = router;
