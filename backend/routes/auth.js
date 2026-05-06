var express = require("express");
var router = express.Router();
const { handleError, rateLimiter } = require("../utils");
var { users } = require("../db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");
const redis = require("../redis");
const { sendResetEmail } = require("../mailer");

router.post("/register", rateLimiter, (req, res) => {
  // console.log(`GET request to "/auth/register" received for user}`);

  if (!req.body.username || !req.body.password)
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });

  if (!req.body.email)
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email))
    return res
      .status(400)
      .json({ success: false, message: "Invalid email address" });

  users.count({}, (err, count) => {
    if (err) return handleError(res, err);

    users.findOne({ username: req.body.username }, (err, user) => {
      if (err) return handleError(res, err);
      if (user)
        return res
          .status(400)
          .json({ success: false, message: "Username already exists" });

      if (req.body.username.length < 6 || req.body.username.length > 32)
        return res.status(400).json({
          success: false,
          message: "Username must be between 6 and 32 characters in length",
        });

      if (req.body.password.length < 6 || req.body.password.length > 32)
        return res.status(400).json({
          success: false,
          message: "Password must be between 6 and 32 characters in length",
        });

      users.insert({
        username: req.body.username,
        password: sha256(req.body.password),
        email: req.body.email,
        balance: 5000,
        cart: [],
        addresses: [],
        orders: [],
        isAdmin: count === 0,
        isSeller: count === 0,
        adminPriority: count === 0 ? 1 : null,
      });

      // console.log(
      //   `Registered user: ${req.body.username}${count === 0 ? " (SuperAdmin)" : ""}`,
      // );
      return res.status(201).json({ success: true });
    });
  });
});

router.post("/login", rateLimiter, (req, res) => {
  // console.log(`POST request to "/auth/login" received`);

  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({
      success: false,
      message: "Username/email and password are required",
    });

  users.findOne({ $or: [{ username }, { email: username }] }, (err, user) => {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Username or email does not exist",
      });
    }
    if (user.password !== sha256(req.body.password)) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }
    const token = jwt.sign({ username: user.username }, config.jwtSecret, {
      expiresIn: "6h",
    });

    // console.log(`Logged in as user: ${user.username}`);

    return res.status(201).json({
      success: true,
      token: token,
      username: user.username,
      balance: user.balance,
      isSeller: user.isSeller,
      isAdmin: user.isAdmin,
      adminPriority: user.adminPriority || null,
    });
  });
});

router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader.split(" ")[0] !== "Bearer")
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) redis.setex(`blacklist:${token}`, ttl, "1");
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { username } = req.body;
  if (!username)
    return res
      .status(400)
      .json({ success: false, message: "Username required" });

  users.findOne({ username }, async (err, user) => {
    if (err) return handleError(res, err);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    await redis.setex(`reset:${token}`, 15 * 60, username);

    try {
      await sendResetEmail(user.email, token);
      return res
        .status(200)
        .json({ success: true, message: "Password reset email sent" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email" });
    }
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res
      .status(400)
      .json({ success: false, message: "Token and new password are required" });

  if (newPassword.length < 6 || newPassword.length > 32)
    return res.status(400).json({
      success: false,
      message: "Password must be between 6 and 32 characters",
    });

  const username = await redis.get(`reset:${token}`);

  if (!username)
    return res
      .status(400)
      .json({ success: false, message: "Reset token is invalid or expired" });

  users.update(
    { username },
    { $set: { password: sha256(newPassword) } },
    {},
    async (err, count) => {
      if (err) return handleError(res, err);
      if (count === 0)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      await redis.del(`reset:${token}`);

      return res
        .status(200)
        .json({ success: true, message: "Password reset successful" });
    },
  );
});

const sha256 = (input) =>
  crypto.createHash("sha256").update(input, "utf8").digest("hex");

module.exports = router;
