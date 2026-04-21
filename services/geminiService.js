const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔥 Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // ✅ stable model
});

// 🔁 Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =========================
// ✅ GENERATE EXPLANATION
// =========================
async function generateExplanation(topic, chatContext = "") {
  try {
    let prompt = `You are a helpful tutor explaining programming concepts to beginner students.`;

    if (chatContext) {
      prompt += `\n\nConversation context:\n${chatContext}\n\nContinue the conversation naturally.`;
    } else {
      prompt += `\nExplain the topic "${topic}" for a beginner student.`;
    }

    prompt += `

Provide the answer in this format:

1. Definition
2. Simple Explanation
3. Example
4. Real-world Use Case
5. Short Summary
`;

    // ✅ Correct Gemini call
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    // ✅ Safe extraction
    const text =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;
  } catch (error) {
    console.error("🔥 FULL GEMINI ERROR:", error);
    console.error("🔥 ERROR MESSAGE:", error.message);
    console.error("🔥 ERROR STACK:", error.stack);
    throw new Error("AI generation failed");
  }
}

// =========================
// ✅ GENERATE QUIZ
// =========================
async function generateQuiz(prompt) {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text =
  result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
  result?.candidates?.[0]?.content?.parts?.[0]?.text;
console.log("🤖 FULL RESULT:", JSON.stringify(result, null, 2));
console.log("🤖 QUIZ RAW:", text);
    console.log("🤖 QUIZ RAW:", text);

    if (!text) {
      throw new Error("Empty quiz response");
    }

    return text;
  } catch (error) {
    console.error("❌ Quiz generation failed:", error);
    throw new Error("Quiz generation failed");
  }
}

module.exports = {
  generateExplanation,
  generateQuiz,
};

