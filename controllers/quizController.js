const Quiz = require("../models/Quiz");
const ChatMessage = require("../models/ChatMessage");
const { generateQuiz } = require("../services/geminiService");

module.exports.createQuiz = async (req, res) => {
  try {
    const {
      sessionId,
      numQuestions = 5,
      difficulty = "medium",
      mode = "practice", // practice | exam
      timer, // optional
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const messages = await ChatMessage.find({ sessionId }).sort({
      createdAt: 1,
    });

    if (!messages.length) {
      return res.status(400).json({
        message: "No chat content available for quiz",
      });
    }

    const messageCount = messages.length;

    // 🔁 Reuse quiz if same content + same config
    const existingQuiz = await Quiz.findOne({
      sessionId,
      userId: req.userId,
      messageCount,
      numQuestions,
      difficulty,
      mode,
    });

    if (existingQuiz) {
      return res.json(existingQuiz);
    }

    // 🧠 Prepare chat context
    const chatContext = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // 🤖 Mode-based explanation control
    const includeExplanation =
      mode === "practice"
        ? "Include explanation for each question."
        : "Do NOT include explanation.";

    // 🎯 AI Prompt
    const prompt = `
Generate ${numQuestions} multiple choice questions.

Difficulty: ${difficulty}
${includeExplanation}

Return ONLY JSON format:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "A",
    "explanation": "..."
  }
]

Conversation:
${chatContext}
`;

    const quizText = await generateQuiz(prompt);

    // 🧹 Clean AI response
    let cleanedText = quizText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleanedText.match(/\[.*\]/s);

    if (!jsonMatch) {
      return res.status(500).json({ message: "Invalid quiz format from AI" });
    }

    let questions = JSON.parse(jsonMatch[0]);

    // ✅ Ensure explanation exists (only for practice)
    if (mode === "practice") {
      questions.forEach((q) => {
        if (!q.explanation) {
          q.explanation = `Correct answer is ${q.answer}`;
        }
      });
    } else {
      // ❌ Remove explanation for exam mode
      questions.forEach((q) => {
        delete q.explanation;
      });
    }

    // 💾 Save quiz
    const quiz = await Quiz.findOneAndUpdate(
      { sessionId, userId: req.userId },
      {
        sessionId,
        userId: req.userId,
        questions,
        messageCount,
        numQuestions,
        difficulty,
        mode,
        timer: timer || null,
      },
      { new: true, upsert: true },
    );

    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Quiz generation failed",
    });
  }
};

module.exports.getQuizBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const quiz = await Quiz.findOne({
      sessionId,
      userId: req.userId,
    });

    if (!quiz) {
      return res.status(404).json({ message: "No quiz found" });
    }

    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch quiz" });
  }
};
