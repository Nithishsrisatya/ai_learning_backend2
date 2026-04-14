const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authmiddleware");

const {
  createChat,
  sendMessage,
  getHistory,
  getMessages,
  deleteChat,
} = require("../controllers/chatController");

router.post("/create", authMiddleware, createChat);
router.post("/send", authMiddleware, sendMessage);
router.get("/history", authMiddleware, getHistory);
router.get("/messages/:sessionId", authMiddleware, getMessages);
router.delete("/:sessionId", authMiddleware, deleteChat);

module.exports = router;
