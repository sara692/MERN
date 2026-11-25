const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one conversation per user
    },
    messages: [messageSchema], // embedded sub-documents
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
