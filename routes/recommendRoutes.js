const express = require("express");
const router = express.Router();

const { getRecommendation } = require("../controllers/recommendController");
const authMiddleware = require("../middleware/authmiddleware");
const { recommendLimiter } = require("../middleware/rateLimiter");

router.get("/next", recommendLimiter, authMiddleware, getRecommendation);

module.exports = router;
