  const express = require("express");

  const router = express.Router();

  const {
    createQuiz,
    getQuizBySession,
  } = require("../controllers/quizController");

  const protect = require("../middleware/authMiddleware");

  router.get("/:sessionId", protect, getQuizBySession);
  router.post("/generate", protect, createQuiz);

  module.exports = router;

