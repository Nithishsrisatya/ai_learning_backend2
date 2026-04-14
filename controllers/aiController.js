const { generateExplanation } = require("../services/geminiService");
const LearningHistory = require("../models/LearningHistory");

exports.generateTopic = async (req, res) => {
  try {
    const topic = req.body.topic?.trim();
    const userId = req.userId;

    // Validate request data
    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }
    if (topic.length > 100) {
      return res
        .status(400)
        .json({ message: "Topic too long (max 100 chars)" });
    }

    // AI Caching: Check if topic already exists in database
    const existingTopic = await LearningHistory.findOne({
      userId,
      topic: { $regex: `^${topic}$`, $options: "i" },
    });

    if (existingTopic) {
      return res.json({
        topic: existingTopic.topic,
        explanation: existingTopic.explanation,
        id: existingTopic._id,
        cached: true,
      });
    }

    const explanation = await generateExplanation(topic);

    // Save to database
    const savedTopic = await LearningHistory.create({
      userId,
      topic,
      explanation,
    });

    res.json({
      topic,
      explanation,
      id: savedTopic._id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "AI generation failed",
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await LearningHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(history);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch history",
    });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    await LearningHistory.findByIdAndDelete(id);

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete chat" });
  }
};
