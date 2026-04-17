const { GoogleGenerativeAI } = require("@google/generative-ai");

// Singleton instances
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateExplanation(topic, chatContext = "") {
  // Retry logic with backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let prompt = `You are a helpful tutor explaining programming concepts to beginner students.`;

      if (chatContext) {
        prompt += `\n\nConversation context:\n${chatContext}\n\nContinue the conversation naturally, maintaining context from previous messages.`;
      } else {
        prompt += ` Explain the topic "${topic}" for a beginner student.`;
      }

      prompt += `

Provide the answer in this exact format:

1. Definition
2. Simple Explanation
3. Example
4. Real-world Use Case
5. Short Summary`;

      const result = await model.generateContent(prompt);
      return await result.response.text();
    } catch (error) {
      console.error(
        `Gemini explanation attempt ${attempt} failed for "${topic}":`,
        error.message,
      );

      if (error.status === 429 && error.errorDetails?.[2]?.retryDelay) {
        const delayMs =
          parseInt(error.errorDetails[2].retryDelay) * 1000 + 1000 * attempt;
        await delay(delayMs);
      } else if (attempt === 3) {
        throw new Error("AI generation failed after retries");
      }
    }
  }
}

async function generateQuiz(topic, chatContext = "") {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  let prompt = `
Generate 5 multiple choice questions about ${topic}.`;

  if (chatContext) {
    prompt += `

Based on this conversation context:

${chatContext}

Make questions specifically from the session content.`;
  } else {
    prompt += `

General questions on the topic.`;
  }

  prompt += `

Return ONLY valid JSON array. No markdown, no extra text.

Format:
[
  {
    "question": "Question text?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "answer": "A) option1",
    "explanation": "Short explanation why this is correct."
  }
]
`;

  const result = await model.generateContent(prompt);

  const text = result.response.text();

  return text;
}

module.exports = {
  generateExplanation,
  generateQuiz,
};
console.log("API KEY:", process.env.GEMINI_API_KEY);