var express = require("express");
const { nanoid } = require("nanoid");
var router = express.Router();
const {
  handleError,
  verifyAuth,
  getProduct,
  getCachedCart,
  setCachedCart,
  delCachedCart,
} = require("../utils");
var { users, products } = require("../db");
const Stripe = require("stripe");
const config = require("../config");
const stripe = new Stripe(config.stripeSecret);
const redis = require("../redis");

const addCartSuggestion = (name) => {
  const words = name.toLowerCase().trim().split(/\s+/);
  const pipeline = redis.pipeline();
  // store "word|fullname" so ZRANGEBYLEX on a word prefix returns the full product name
  words.forEach((word) => {
    if (word.length >= 3) pipeline.zadd("suggestions", 0, `${word}|${name.toLowerCase().trim()}`);
  });
  return pipeline.exec();
};

router.get("/", verifyAuth, async (req, res) => {
  // console.log(`GET request to "/cart" received`);

  const cached = await getCachedCart(req.user.username);
  if (cached) return res.status(200).json(cached);

  await setCachedCart(req.user.username, req.user.cart);
  return res.status(200).json(req.user.cart);
});

router.post("/", verifyAuth, async (req, res) => {
  // console.log(`POST request to "/cart" received`);

  products.findOne({ _id: req.body.productId }, async (err, product) => {
    if (err) return handleError(res, err);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product doesn't exist" });

    const index = req.user.cart.findIndex(
      (element) => element.productId === req.body.productId,
    );

    if (index === -1) {
      req.user.cart.push({ productId: req.body.productId, qty: req.body.qty });
      addCartSuggestion(product.name); // new item added to cart — add to suggestions
    } else if (req.body.qty === 0) {
      req.user.cart.splice(index, 1);
    } else {
      req.user.cart[index].qty = req.body.qty;
    }

    users.update(
      { _id: req.user._id },
      { $set: { cart: req.user.cart } },
      {},
      async (err) => {
        if (err) return handleError(res, err);
        // console.log(
        //   `User ${req.user.username}'s cart updated to`,
        //   req.user.cart,
        // );
        await setCachedCart(req.user.username, req.user.cart);
        return res.status(200).json(req.user.cart);
      },
    );
  });
});

router.post("/checkout", verifyAuth, async (req, res) => {
  // console.log(
  //   `POST request received to "/cart/checkout": ${req.user.username}`,
  // );

  if (!req.user.cart.length)
    return res.status(400).json({ success: false, message: "Cart is empty" });

  if (!req.body.addressId)
    return res.status(400).json({ success: false, message: "Address not set" });

  const addressIndex = req.user.addresses.findIndex(
    (element) => element._id === req.body.addressId,
  );
  if (addressIndex === -1)
    return res
      .status(404)
      .json({ success: false, message: "Bad address specified" });

  const { paymentMethod, paymentIntentId } = req.body;

  if (!paymentMethod || !["wallet", "card"].includes(paymentMethod))
    return res
      .status(400)
      .json({ success: false, message: "Invalid payment method" });

  let total = 0;
  const resolvedItems = [];

  for (let element of req.user.cart) {
    const product = await getProduct(element.productId);
    if (!product)
      return res
        .status(400)
        .json({ success: false, message: "Invalid product in cart" });
    total += element.qty * product.cost;
    resolvedItems.push({
      productId: element.productId,
      name: product.name,
      qty: element.qty,
      cost: product.cost,
    });
  }

  if (paymentMethod === "wallet") {
    if (req.user.balance < total)
      return res
        .status(400)
        .json({
          success: false,
          message: "Wallet balance not sufficient to place order",
        });
  } else if (paymentMethod === "card") {
    if (!paymentIntentId)
      return res
        .status(400)
        .json({ success: false, message: "Payment intent ID required" });
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== "succeeded")
        return res
          .status(400)
          .json({ success: false, message: "Payment not completed" });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment intent" });
    }
  }

  const order = {
    orderId: nanoid(),
    items: resolvedItems,
    total,
    address: req.user.addresses[addressIndex].address,
    date: new Date().toISOString(),
    paymentMethod,
  };

  for (const item of resolvedItems) {
    products.update(
      { _id: item.productId },
      { $inc: { revenue: item.qty * item.cost } },
      {},
    );
  }

  if (paymentMethod === "wallet") req.user.balance -= total;
  req.user.cart = [];
  req.user.orders = [...(req.user.orders || []), order];

  users.update({ _id: req.user._id }, req.user, {}, async (err) => {
    if (err) return handleError(res, err);
    await delCachedCart(req.user.username);
    return res.status(200).json({ success: true, order });
  });
});

module.exports = router;
