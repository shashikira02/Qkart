const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const config = require("../config");
const { verifyAuth, handleError } = require("../utils");
var { users } = require("../db");

const stripe = new Stripe(config.stripeSecret);

router.post("/create-intent", verifyAuth, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0)
    return res.status(400).json({ success: false, message: "Invalid amount" });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: { username: req.user.username },
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/topup", verifyAuth, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 1 || amount > 10000)
    return res.status(400).json({ success: false, message: "Amount must be between $1 and $10000" });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: "usd",
      metadata: { username: req.user.username, type: "wallet_topup" },
    });
    return res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/topup/confirm", verifyAuth, async (req, res) => {
  const { paymentIntentId, amount } = req.body;

  if (!paymentIntentId || !amount)
    return res.status(400).json({ success: false, message: "Missing required fields" });

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded")
      return res.status(400).json({ success: false, message: "Payment not completed" });

    users.update(
      { _id: req.user._id },
      { $inc: { balance: Number(amount) } },
      {},
      (err) => {
        if (err) return handleError(res, err);
        const newBalance = req.user.balance + Number(amount);
        return res.status(200).json({ success: true, newBalance });
      }
    );
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
