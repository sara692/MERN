const express = require("express");
const Chat = require("../models/Chat");
const { askLLM } = require("../services/openrouter");

const router = express.Router();

const MAX_LENGTH = 2000;      // max characters per user message
const CONTEXT_MESSAGES = 20;  // how many recent messages the model sees
const SYSTEM_PROMPT = "You are a helpful assistant. Keep answers clear and concise.";

// GET: my conversation
router.get("/", async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id });
    res.json({ messages: chat ? chat.messages : [] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST: send a message, get the AI reply
router.post("/", async (req, res) => {
  try {
    const content =
      typeof req.body.content === "string" ? req.body.content.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (content.length > MAX_LENGTH) {
      return res
        .status(400)
        .json({ error: `Message must be at most ${MAX_LENGTH} characters` });
    }

    let chat = await Chat.findOne({ user: req.user._id });
    if (!chat) chat = new Chat({ user: req.user._id, messages: [] });

    chat.messages.push({ role: "user", content });

    // Only send the latest messages, to keep requests small
    const context = chat.messages
      .slice(-CONTEXT_MESSAGES)
      .map(({ role, content }) => ({ role, content }));

    const { reply } = await askLLM([
      { role: "system", content: SYSTEM_PROMPT },
      ...context,
    ]);

    chat.messages.push({ role: "assistant", content: reply });
    await chat.save(); // saved only if the AI answered

    res.status(201).json({ messages: chat.messages.slice(-2) });
  } catch (err) {
    console.error("Chat error:", err.message);
    if (err.status === 429) {
      return res
        .status(429)
        .json({ error: "The free AI limit was reached. Try again later." });
    }
    res.status(502).json({ error: "The AI could not answer. Please try again." });
  }
});

// DELETE: clear my conversation
router.delete("/", async (req, res) => {
  try {
    await Chat.deleteOne({ user: req.user._id });
    res.json({ message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;