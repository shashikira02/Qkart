const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const config = require("./config");
const app = express();

app.use(cors({ origin: config.clientUrl }));
app.use(express.json());
app.use(helmet());
app.use(mongoSanitize()); 

const authRouter = require("./routes/auth");
const productRouter = require("./routes/product");
const cartRouter = require("./routes/cart");
const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payments");
const adminRouter = require("./routes/admin");

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/admin", adminRouter);

const port = config.port;
app.listen(port, () => {
  console.log(`QKart Backend running at port ${port}`);
});
