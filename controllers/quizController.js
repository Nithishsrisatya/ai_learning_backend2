const Quiz = require("../models/Quiz");
const { generateQuiz } = require("../services/geminiService");

module.exports.createQuiz = async (req, res) => {
  try {
    let {
      sessionId,
      numQuestions = 5,
      difficulty = "medium",
      mode = "practice", // practice | exam
      timer, // optional
      topic
    } = req.body;

    // 🔥 1. Strict Auth Check (No 'testUser' fallback)
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    if (!topic || !sessionId) {
      return res.status(400).json({ message: "Topic and Session ID are required" });
    }

    // 🔥 2. Bounds Checking for API Protection
    // Ensure numQuestions is an integer between 1 and 15
    numQuestions = Math.min(Math.max(parseInt(numQuestions) || 5, 1), 15);

    const messageCount = 0; 

    // 🔁 Reuse quiz if same content + same config
    const existingQuiz = await Quiz.findOne({
      sessionId,
      userId,
      messageCount,
      numQuestions,
      difficulty,
      mode,
    });

    if (existingQuiz) {
      return res.json(existingQuiz);
    }

    // 🤖 Mode-based explanation control
    const includeExplanation = mode === "practice"
        ? "Include a detailed 'explanation' field for each question."
        : "Do NOT include an 'explanation' field.";

    // 🎯 AI Prompt (Streamlined since Gemini 2.5 Flash handles JSON natively now)
    const prompt = `
      Generate exactly ${numQuestions} multiple choice questions on the topic "${topic}".
      Difficulty level: ${difficulty}.
      ${includeExplanation}
      
      Respond with a JSON array of objects. Each object must have: 
      "question" (string), "options" (array of 4 strings), "answer" (string matching one option).
    `;

    const quizText = await generateQuiz(prompt);

    let questions;
    try {
      // 🔥 3. Direct Parse (Safe now because of responseMimeType in service)
      questions = JSON.parse(quizText);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", err.message, "\nRAW TEXT:", quizText);
      return res.status(500).json({ message: "Failed to parse AI generated quiz." });
    }

    // ✅ Ensure explanation exists (only for practice)
    if (mode === "practice") {
      questions.forEach((q) => {
        if (!q.explanation) {
          q.explanation = `The correct answer is ${q.answer}.`;
        }
      });
    } else {
      // ❌ Force remove explanation for exam mode just in case AI included it
      questions.forEach((q) => delete q.explanation);
    }

    // 💾 Save or Update quiz
    const quiz = await Quiz.findOneAndUpdate(
      { sessionId, userId },
      {
        sessionId,
        userId,
        questions,
        messageCount,
        numQuestions,
        difficulty,
        mode,
        timer: timer || null,
      },
      { new: true, upsert: true }
    );

    res.json(quiz);
    
  } catch (error) {
    console.error("🔥 Create Quiz Error:", error);
    res.status(500).json({ message: "Quiz generation failed" });
  }
};

module.exports.getQuizBySession = async (req, res) => {
  try {
    const userId = req.userId; // Enforce real auth
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const quiz = await Quiz.findOne({ sessionId, userId });

    if (!quiz) {
      return res.status(404).json({ message: "No quiz found for this session." });
    }

    res.json(quiz);
  } catch (error) {
    console.error("🔥 Get Quiz Error:", error);
    res.status(500).json({ message: "Failed to fetch quiz" });
  }
};