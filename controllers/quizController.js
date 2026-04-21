const Quiz = require("../models/Quiz");
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

    const userId = req.userId || "testUser";
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const messageCount = 0; // since no chat is used

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    // 🔁 Reuse quiz if same content + same config
    const existingQuiz = await Quiz.findOne({
      sessionId,
      userId: userId,
      messageCount,
      numQuestions,
      difficulty,
      mode,
    });

    if (existingQuiz) {
      return res.json(existingQuiz);
    }

    // 🤖 Mode-based explanation control
    const includeExplanation =
      mode === "practice"
        ? "Include explanation for each question."
        : "Do NOT include explanation.";

    // 🎯 AI Prompt
    const prompt = `
Generate ${numQuestions} multiple choice questions on the topic "${topic}".

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

    let questions;
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", jsonMatch[0]);
      return res.status(500).json({
        message: "Invalid JSON from AI",
      });
    }

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
      { sessionId, userId: userId },
      {
        sessionId,
        userId: userId,
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
    const userId = req.userId || "testUser";
    const { sessionId } = req.params;

    const quiz = await Quiz.findOne({
      sessionId,
      userId: userId
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

