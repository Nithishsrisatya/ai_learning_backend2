const rateLimit = require("express-rate-limit");

const aiRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each user to 20 AI requests per hour
  message: {
    message: "Too many AI requests, please try again later",
  },
  keyGenerator: (req) => req.userId || rateLimit.ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
});

const recommendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user to 5 recommendations per hour
  message: {
    message: "Too many recommendation requests, please try again later",
  },
  keyGenerator: (req) => req.userId || rateLimit.ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRequestLimiter, recommendLimiter };
