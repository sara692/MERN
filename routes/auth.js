const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

const cookieOptions = {
  httpOnly: true, // JS in the browser cannot read it
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax", // basic CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT_EXPIRES_IN)
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendAuthResponse = (res, user, status = 200) => {
  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions);
  res.status(status).json({
    user: { id: user._id, name: user.name, email: user.email },
  });
};

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    sendAuthResponse(res, user, 201);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // password has select:false, so we must ask for it explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    // Same message for both cases, so attackers can't tell which emails exist
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    sendAuthResponse(res, user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// CHECK IF LOGGED IN (the frontend calls this when the site loads)
router.get("/me", protect, (req, res) => {
  const { _id, name, email } = req.user;
  res.json({ user: { id: _id, name, email } });
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ message: "Logged out" });
});

module.exports = router;
