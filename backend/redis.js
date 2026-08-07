const Redis = require("ioredis");
const config = require('./config')

let redis;

// If a full Redis URL is provided (REDIS_URL), prefer it. Otherwise use host/port/password/tls.
if (config.redis.url) {
  redis = new Redis(config.redis.url);
} else {
  const redisConfig = {
    host: config.redis.host,
    port: config.redis.port,
  };

  if (config.redis.password) {
    redisConfig.password = config.redis.password;
  }

  if (config.redis.tls) {
    redisConfig.tls = {};
  }

  redis = new Redis(redisConfig);
}

redis.on("connect", () => console.log("Redis Connected"));
redis.on("error", (err) => console.error("Redis Error: ", err));

module.exports = redis;
