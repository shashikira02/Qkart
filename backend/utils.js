const jwt = require("jsonwebtoken");
const redis = require("./redis");
const config = require("./config");
var { users, products } = require("./db");

const CACHE_TTL = 300;
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const safeParseCache = (data) => {
  if (typeof data !== "string" || data.trim() === "") return null;
  try {
    const raw = JSON.parse(data, (key, value) => {
      if (BLOCKED_KEYS.has(key)) return undefined;
      return value;
    });
    if (typeof raw !== "object" || raw === null) return null;
    return JSON.parse(JSON.stringify(raw));
  } catch (_) {
    return null;
  }
};

const getCachedProducts = async () => {
  const data = await redis.get("products:all");
  const parsed = safeParseCache(data);
  if (!parsed && data) await redis.del("products:all");
  return parsed;
};

const setCachedProducts = (docs) =>
  redis.setex("products:all", CACHE_TTL, JSON.stringify(docs));

const getCachedProduct = async (id) => {
  const key = `products:${id}`;
  const data = await redis.get(key);
  const parsed = safeParseCache(data);
  if (!parsed && data) await redis.del(key);
  return parsed;
};

const setCachedProduct = (id, product) =>
  redis.setex(`products:${id}`, CACHE_TTL, JSON.stringify(product));

const getCachedCart = async (username) => {
  const data = await redis.get(`cart:${username}`);
  const parsed = safeParseCache(data);
  if (!parsed && data) await redis.del(`cart:${username}`);
  return parsed;
};

const setCachedCart = (username, cart) =>
  redis.setex(`cart:${username}`, CACHE_TTL, JSON.stringify(cart));

const delCachedCart = (username) => redis.del(`cart:${username}`);

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60;

const rateLimiter = async (req, res, next) => {
  const key = `ratelimit:${req.ip}:${req.path}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) await redis.expire(key, RATE_LIMIT_WINDOW);
  if (attempts > RATE_LIMIT_MAX) {
    const ttl = await redis.ttl(key);
    return res.status(429).json({
      success: false,
      message: `Too many attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`,
    });
  }
  next();
};

const delCachedProduct = (id) => redis.del(`products:${id}`);

const delCachedProducts = () => redis.del(`products:all`);

const getProduct = (productId) => {
  return new Promise((resolve, reject) => {
    products.findOne({ _id: productId }, (err, docs) => {
      if (err) {
        reject(err);
      }
      resolve(docs);
    });
  });
};

const verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (
    authHeader &&
    authHeader.split(" ").length > 1 &&
    authHeader.split(" ")[0] === "Bearer"
  ) {
    jwt.verify(
      authHeader.split(" ")[1],
      config.jwtSecret,
      {},

      async (err, payload) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Bad or expired token",
          });
        }
        if (!authHeader || authHeader.split(" ")[0] !== "Bearer")
          return res
            .status(401)
            .json({ success: false, message: "No token provided" });

        const token = authHeader.split(" ")[1];
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res
            .status(401)
            .json({ success: false, message: "Token has been invalidated" });
        }
        users.findOne({ username: payload.username }, (err, user) => {
          if (err) {
            return handleError(res, err);
          }
          if (!user) {
            return res.status(400).json({
              success: false,
              message: "Bad token or user no longer exists",
            });
          }
          req.user = user;
          next();
        });
      },
    );
  } else {
    return res.status(401).json({
      success: false,
      message: "Protected route, Oauth2 Bearer token not found",
    });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyAuth(req, res, () => {
    if (!req.user.isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admins only." });
    next();
  });
};

const verifySeller = (req, res, next) => {
  verifyAuth(req, res, () => {
    if (!req.user.isSeller && !req.user.isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Sellers only" });
    next();
  });
};

const handleError = (res, err) => {
  console.log(err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Check the backend console for more details",
  });
};

module.exports.handleError = handleError;
module.exports.verifyAuth = verifyAuth;
module.exports.verifyAdmin = verifyAdmin;
module.exports.verifySeller = verifySeller
module.exports.getProduct = getProduct;
module.exports.getCachedProducts = getCachedProducts;
module.exports.setCachedProducts = setCachedProducts;
module.exports.getCachedProduct = getCachedProduct;
module.exports.setCachedProduct = setCachedProduct;
module.exports.getCachedCart = getCachedCart;
module.exports.setCachedCart = setCachedCart;
module.exports.delCachedCart = delCachedCart;
module.exports.rateLimiter = rateLimiter;
module.exports.delCachedProduct = delCachedProduct;
module.exports.delCachedProducts = delCachedProducts;
