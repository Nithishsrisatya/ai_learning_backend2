const { GoogleGenerativeAI } = require("@google/generative-ai");

// Singleton instances
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// In-memory cache: Map<key, {result, timestamp}>
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Fallback topics
const fallbackTopics = [
  "Introduction to Programming",
  "Variables and Data Types",
  "Control Structures",
  "Functions",
  "Arrays and Loops",
  "Object-Oriented Programming",
  "Web Development Basics",
];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function suggestNextTopic(history) {
  const historyStr = JSON.stringify(history.sort());
  const cached = cache.get(historyStr);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    const prompt = `A student has learned these topics: ${history.join(", ")}.

Suggest the next SINGLE topic they should learn. Respond with ONLY the topic name.`;

    const result = await model.generateContent(prompt);
    const suggestion = await result.response.text();

    // Cache success
    cache.set(historyStr, {
      result: suggestion.trim(),
      timestamp: Date.now(),
    });
    return suggestion.trim();
  } catch (error) {
    console.error("Gemini recommendation failed:", error.message);
    console.warn("Using fallback recommendation due to API failure");
    const learnedCount = history.length;
    const fallbackIndex = learnedCount % fallbackTopics.length;
    const fallback = fallbackTopics[fallbackIndex];
    cache.set(historyStr, { result: fallback, timestamp: Date.now() });
    return fallback;
  }
}

module.exports = suggestNextTopic;
