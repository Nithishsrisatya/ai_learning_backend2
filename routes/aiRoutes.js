const express = require("express");
const router = express.Router();

const {
  generateTopic,
  getHistory,
  deleteChat,
} = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");
const { aiRequestLimiter } = require("../middleware/rateLimiter");

router.post("/learn", authMiddleware, aiRequestLimiter, generateTopic);
router.get("/history", authMiddleware, getHistory);
router.delete("/:id", authMiddleware, deleteChat);

module.exports = router;
