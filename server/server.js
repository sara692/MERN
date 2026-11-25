require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const notesRouter = require("./routes/notes");
const authRouter = require("./routes/auth");
const protect = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const rateLimit = require("express-rate-limit");
const chatRouter = require("./routes/chat");

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10, // 10 chat requests per minute per IP
  message: { error: "Too many messages. Please slow down." },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL, // must be a specific origin, not "*"
    credentials: true, // allow cookies to be sent
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", authRouter);
app.use("/api/notes", protect, notesRouter);
app.use("/api/chat", protect, chatLimiter, chatRouter);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
