var express = require("express");
var router = express.Router();
const {
  handleError,
  getProduct,
  getCachedProducts,
  getCachedProduct,
  setCachedProducts,
  setCachedProduct,
  delCachedProducts,
  delCachedProduct,
  verifySeller
} = require("../utils");
var { products } = require("../db");
const escapeStringRegexp = require("escape-string-regexp");
const redis = require("../redis");

const SUGGESTIONS_KEY = "suggestions";

router.get("/", async (req, res) => {
  // console.log("Request received for retrieving products list");

  const cached = await getCachedProducts();
  if (cached) return res.status(200).json(cached);

  products.find({}, async (err, docs) => {
    if (err) return handleError(res, err);
    await setCachedProducts(docs);
    return res.status(200).json(docs);
  });
});

router.get("/suggestions", async (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  if (!q) return res.status(200).json([]);

  try {
    const results = await redis.zrangebylex(
      SUGGESTIONS_KEY,
      `[${q}`,
      `[${q}\xff`,
      "LIMIT",
      0,
      20  // fetch more since we deduplicate
    );
    // each entry is "word|fullname" — extract unique full names
    const seen = new Set();
    const names = [];
    for (const entry of results) {
      const fullName = entry.split("|").slice(1).join("|"); // handle | in product names
      if (fullName && !seen.has(fullName)) {
        seen.add(fullName);
        names.push(fullName);
        if (names.length === 6) break;
      }
    }
    return res.status(200).json(names);
  } catch {
    return res.status(200).json([]);
  }
});

router.get("/search", (req, res) => {
  // console.log("Request received for searching ", req.query.value);
  const searchRegex = new RegExp(escapeStringRegexp(req.query.value), "i");
  products.find(
    { $or: [{ name: searchRegex }, { category: searchRegex }] },
    (err, docs) => {
      if (err) return handleError(res, err);
      return docs.length
        ? res.status(200).json(docs)
        : res.status(404).json([]);
    },
  );
});

router.get("/my-products", verifySeller, (req, res) => {
  const query = req.user.isAdmin ? {} : { addedBy: req.user.username };

  products.find(query, (err, docs) => {
    if (err) return handleError(res, err);

    const totalRevenue = docs.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const docsWithRevenue = docs.map((p) => ({ ...p, revenue: p.revenue || 0 }));

    return res.status(200).json({ products: docsWithRevenue, totalRevenue });
  });
});


router.get("/:id", async (req, res) => {
  // console.log(
  //   `Request received for retrieving product with id: ${req.params.id}`,
  // );
  try {
    const cached = await getCachedProduct(req.params.id);
    if (cached) return res.status(200).json(cached);

    const product = await getProduct(req.params.id);
    if (!product) return res.status(404).json();

    await setCachedProduct(req.params.id, product);
    return res.status(200).json(product);
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/", verifySeller, async (req, res) => {
  const { name, category, cost, rating, image } = req.body;
  if (!name || !category || !cost || !rating || !image)
    return res.status(400).json({ success: false, message: "All product fields are required" });

  products.insert(
    { name, category, cost, rating, image, addedBy: req.user.username },
    async (err, doc) => {
      if (err) return handleError(res, err);
      await Promise.all([delCachedProducts()]);
      return res.status(201).json(doc);
    }
  );
});

router.put("/:id", verifySeller, async (req, res) => {
  const { name, category, cost, rating, image } = req.body;

  const query = req.user.isAdmin
    ? { _id: req.params.id }
    : { _id: req.params.id, addedBy: req.user.username };

  products.update(
    query,
    { $set: { name, category, cost, rating, image } },
    {},
    async (err, count) => {
      if (err) return handleError(res, err);
      if (count === 0)
        return res.status(404).json({ success: false, message: "Product not found or not authorized" });
      await Promise.all([delCachedProducts(), delCachedProduct(req.params.id)]);
      return res.status(200).json({ success: true });
    }
  );
});

router.delete("/:id", verifySeller, async (req, res) => {
  const query = req.user.isAdmin
    ? { _id: req.params.id }
    : { _id: req.params.id, addedBy: req.user.username };

  products.remove(query, {}, async (err, count) => {
    if (err) return handleError(res, err);
    if (count === 0)
      return res.status(404).json({ success: false, message: "Product not found or not authorized" });
    await Promise.all([delCachedProducts(), delCachedProduct(req.params.id)]);
    return res.status(200).json({ success: true });
  });
});


module.exports = router;
