const mongoose = require("mongoose");
const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const { generateExplanation } = require("../services/geminiService");

exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    // 1. Fetch session and VALIDATE OWNERSHIP
    const session = await ChatSession.findById(sessionId);
    if (!session || session.userId.toString() !== req.userId.toString()) {
      return res.status(404).json({ message: "Chat session not found or unauthorized" });
    }

    // 2. Fetch ONLY the last 10 messages for context to save Gemini tokens
    // We sort descending to get the newest, limit to 10, then reverse to chronological order
    const recentMessages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(10);
    recentMessages.reverse();

    const chatContext = recentMessages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // 3. Save the NEW user message to the database
    await ChatMessage.create({
      sessionId,
      role: "user",
      content: message,
    });

    // 4. Generate AI response
    // Notice how `chatContext` only has the past history, and `message` is the new prompt.
    const aiResponse = await generateExplanation(message, chatContext);

    // 5. Save AI message
    await ChatMessage.create({
      sessionId,
      role: "ai",
      content: aiResponse,
    });

    // 6. If first message -> set chat title
    if (session.title === "New Chat" || !session.title) {
      session.title = message.slice(0, 30) + "...";
      await session.save();
    }

    res.json({ reply: aiResponse });
    
  } catch (error) {
    console.error("🔥 Send Message Error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

exports.createChat = async (req, res) => {
  try {
    const session = await ChatSession.create({
      userId: req.userId,
      title: "New Chat", // Good practice to default this
    });
    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create chat session" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    // 1. Find all unique session IDs that actually have messages inside them
    // This looks at the ChatMessage collection and grabs an array of active IDs
    const activeSessionIds = await ChatMessage.distinct("sessionId");

    // 2. Fetch the user's sessions, but ONLY if their ID is in that active list
    // We also explicitly hide any leftover test sessions named "New Chat" or empty strings
    const sessions = await ChatSession.find({ 
      userId: req.userId,
      _id: { $in: activeSessionIds },
      title: { $nin: ["New Chat", "", null] } 
    }).sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error("🔥 Get History Error:", error);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    // Security Check: Does this user own this session?
    const session = await ChatSession.findById(sessionId);
    if (!session || session.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Unauthorized access to messages" });
    }

    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
    res.json(messages);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Security Check
    const session = await ChatSession.findById(sessionId);
    if (!session || session.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this chat" });
    }

    await ChatSession.findByIdAndDelete(sessionId);
    await ChatMessage.deleteMany({ sessionId });
    
    res.json({ message: "Chat successfully deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete chat" });
  }
};