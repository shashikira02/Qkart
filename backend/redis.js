const Redis = require("ioredis");
const config = require('./config')

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

const redis = new Redis(redisConfig);

redis.on("connect", () => console.log("Redis Connected"));
redis.on("error", (err) => console.error("Redis Error: ", err));

module.exports = redis;
