const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔥 Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // ✅ stable model
});

// 🔁 Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =========================
// ✅ GENERATE EXPLANATION
// =========================
async function generateExplanation(topic, chatContext = "") {
  for (let attempt = 1; attempt <= 3; attempt++) {
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

  if (attempt === 3) {
    throw new Error("AI generation failed after retries");
  }

  await delay(1000 * attempt);
}
  }
}

// =========================
// ✅ GENERATE QUIZ
// =========================
async function generateQuiz(topic, chatContext = "") {
  try {
    let prompt = `
Generate 5 multiple choice questions about "${topic}".
`;

    if (chatContext) {
      prompt += `

Based on this conversation:

${chatContext}
`;
    }

    prompt += `

Return ONLY valid JSON array.

Format:
[
  {
    "question": "Question text?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "answer": "A) option1",
    "explanation": "Short explanation"
  }
]
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text =
      result.candidates?.[0]?.content?.parts?.[0]?.text;

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