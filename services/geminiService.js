const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔥 Check API Key
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

// 🔥 Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use stable model
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// =========================
// ✅ SAFE TEXT EXTRACTOR
// =========================
function extractText(result) {
  return (
    result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    result?.candidates?.[0]?.content?.parts?.[0]?.text ||
    null
  );
}

// =========================
// ✅ GENERATE EXPLANATION
// =========================
async function generateExplanation(topic, chatContext = "") {
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

    const text = extractText(result);

    console.log("🧠 EXPLANATION RAW:", text);

    if (!text) throw new Error("Empty response from Gemini");

    return text;

  } catch (error) {
    console.error("❌ EXPLANATION ERROR:", error.message);
    throw new Error("AI explanation failed");
  }
}

// =========================
// ✅ GENERATE QUIZ
// =========================
async function generateQuiz(prompt) {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = extractText(result);

    console.log("🤖 QUIZ RAW:", text);

    if (!text) throw new Error("Empty quiz response");

    return text;

  } catch (error) {
    console.error("❌ QUIZ ERROR:", error.message);
    throw new Error("Quiz generation failed");
  }
}

// =========================
// EXPORTS
// =========================
module.exports = {
  generateExplanation,
  generateQuiz,
};