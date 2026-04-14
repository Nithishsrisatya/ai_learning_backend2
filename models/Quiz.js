const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  topic: String,
  questions: [
    {
      question: String,
      options: [String],
      answer: String,
      explanation: String,
    },
  ],
  messageCount: Number,
  numQuestions: {
    type: Number,
    default: 5,
  },
  difficulty: {
    type: String,
    default: "medium",
  },
  mode: {
    type: String,
    default: "practice",
  },
  timer: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Quiz", quizSchema);
