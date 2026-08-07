require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8082,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL,
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true',
  },
  email: {
    user: process.env.GMAIL_APP_MAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  stripeSecret: process.env.STRIPE_SECRET_KEY
};
