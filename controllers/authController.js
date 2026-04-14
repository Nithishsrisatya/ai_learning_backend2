const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    console.log("Register request body:", JSON.stringify(req.body, null, 2));

    let { nickname, email, password } = req.body;
    email = email?.toLowerCase().trim();

    if (!email || !password || !nickname) {
      console.log("Validation failed: missing fields", {
        email: !!email,
        password: !!password,
        nickname: !!nickname,
      });
      return res
        .status(400)
        .json({ message: "Email, password, and nickname required" });
    }
    if (password.length < 6) {
      console.log("Validation failed: short password", password?.length);
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    console.log("Checking existing user for email:", email);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("User already exists:", existingUser._id);
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Creating user...");
    const user = await User.create({
      nickname,
      email,
      password: hashedPassword,
    });

    console.log("User created successfully:", user._id);
    res.json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register error details:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
