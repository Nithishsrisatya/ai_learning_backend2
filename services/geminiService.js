const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔥 Validate API Key
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

// 🔥 Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Stable model
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // ⚠️ recommended stable
});

// =========================
// ✅ SAFE TEXT EXTRACTOR
// =========================
function extractText(result) {
  const text =
    result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    result?.candidates?.[0]?.content?.parts?.[0]?.text;

  return text?.trim() || null;
}

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
      let prompt = `You are a helpful tutor explaining concepts for beginners.`;

      if (chatContext) {
        prompt += `\n\nConversation:\n${chatContext}`;
      } else {
        prompt += `\nExplain the topic "${topic}".`;
      }

      prompt += `

Provide:
1. Definition
2. Simple Explanation
3. Example
4. Real-world Use Case
5. Summary
`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      // 🔥 ADD THIS LINE HERE
      console.log("🧠 FULL GEMINI RESPONSE:", JSON.stringify(result, null, 2));

      // 🔍 Debug (safe log)
      console.log("🧠 RAW RESPONSE:", result?.response);

      const text = extractText(result);

      console.log("🧠 EXTRACTED TEXT:", text);

      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      return text;

    } catch (error) {
      console.error("🔥 GEMINI EXPLANATION ERROR:", error.message);

      // ✅ fallback (NO 500 error)
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
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      console.log("🤖 RAW RESPONSE:", result?.response);

      const text = extractText(result);

      console.log("🤖 QUIZ TEXT:", text);

      if (!text) {
        throw new Error("Empty quiz response");
      }

      return text;

    } catch (error) {
      console.error("🔥 GEMINI QUIZ ERROR:", error.message);

      // ✅ fallback quiz (never break app)
      return `
[
  {
    "question": "What is 2 + 2?",
    "options": ["1", "2", "3", "4"],
    "answer": "4",
    "explanation": "2 + 2 equals 4"
  }
]
`;
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