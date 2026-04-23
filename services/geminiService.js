const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔥 Validate API Key
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

// 🔥 Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Standard model with a System Instruction for explanations
const tutorModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: "You are a helpful tutor explaining concepts for beginners. Always provide: 1. Definition, 2. Simple Explanation, 3. Example, 4. Real-world Use Case, 5. Summary.",
});

// ✅ Specialized model FORCED to output valid JSON for quizzes
const jsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

// =========================
// 🔁 RETRY HELPER
// =========================
async function withRetry(fn, retries = 1) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log("🔁 Retrying Gemini...");
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

// =========================
// ✅ GENERATE EXPLANATION
// =========================
async function generateExplanation(topic, chatContext = "") {
  return withRetry(async () => {
    try {
      let promptText = `Explain the topic "${topic}".`;
      
      if (chatContext) {
        promptText = `Conversation:\n${chatContext}\n\n${promptText}`;
      }

      const result = await tutorModel.generateContent(promptText);
      const text = result.response.text(); 
      
      if (!text) {
        throw new Error("Empty response from Gemini");
      }
      
      return text;

    } catch (error) {
      console.error("🔥 GEMINI EXPLANATION ERROR:", error.message);
      return "AI couldn't generate explanation. Please try again.";
    }
  });
}

// =========================
// ✅ GENERATE QUIZ
// =========================
async function generateQuiz(prompt) {
  return withRetry(async () => {
    try {
      // Using the jsonModel guarantees strict, clean JSON output without markdown backticks
      const result = await jsonModel.generateContent(prompt);
      const text = result.response.text();

      if (!text) {
        throw new Error("Empty quiz response");
      }
      
      return text;

    } catch (error) {
      console.error("🔥 GEMINI QUIZ ERROR:", error.message);
      // Fallback JSON string ensuring the frontend parsing doesn't crash
      return JSON.stringify([
        {
          question: "What is 2 + 2?",
          options: ["1", "2", "3", "4"],
          answer: "4",
          explanation: "2 + 2 equals 4"
        }
      ]);
    }
  });
}

// =========================
// EXPORTS
// =========================
module.exports = {
  generateExplanation,
  generateQuiz,
};