const LearningHistory = require("../models/LearningHistory");
const suggestNextTopic = require("../services/recommendationService");

exports.getRecommendation = async (req, res) => {
  try {
    const history = await LearningHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const topics = history.map((h) => h.topic).slice(0, 5);

    let suggestion;
    if (topics.length === 0) {
      suggestion = "Start with Basics of Programming";
    } else {
      suggestion = await suggestNextTopic(topics);
    }

    res.json({
      learned: topics,
      nextTopic: suggestion,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Recommendation failed",
    });
  }
};
