const mongoose = require("mongoose");
const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const { generateExplanation } = require("../services/geminiService");

exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    let session = await ChatSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Chat session not found",
      });
    }

    // Save user message
    await ChatMessage.create({
      sessionId,
      role: "user",
      content: message,
    });

    // Get previous messages for context (includes just-saved user message)
    const messages = await ChatMessage.find({ sessionId }).sort({
      createdAt: 1,
    });

    const chatContext = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // Generate AI response with full context
    const aiResponse = await generateExplanation(message, chatContext);

    // Save AI message
    await ChatMessage.create({
      sessionId,
      role: "ai",
      content: aiResponse,
    });

    // If first message -> set chat title
    if (session.title === "New Chat") {
      session.title = message.slice(0, 30);
      await session.save();
    }

    res.json({
      reply: aiResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

exports.createChat = async (req, res) => {
  const session = await ChatSession.create({
    userId: req.userId,
  });
  res.json(session);
};

exports.getHistory = async (req, res) => {
  const sessions = await ChatSession.find({
    userId: req.userId,
  }).sort({ createdAt: -1 });
  res.json(sessions);
};

exports.getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const messages = await ChatMessage.find({ sessionId }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

exports.deleteChat = async (req, res) => {
  await ChatSession.findByIdAndDelete(req.params.sessionId);
  await ChatMessage.deleteMany({
    sessionId: req.params.sessionId,
  });
  res.json({ message: "Chat deleted" });
};
