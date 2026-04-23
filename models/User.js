const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true, // Prevents duplicate emails with different casing
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // Keeps it consistent with your other models
);

module.exports = mongoose.model("User", userSchema);