const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const aiRoutes = require("./routes/aiRoutes");
const recommendRoutes = require("./routes/recommendRoutes");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");

const app = express();
const chatRoutes = require("./routes/chatRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database first
connectDB();

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("AI Learning Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
