import { Button, Divider, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import "./Thanks.css";

const Thanks = () => {
  const history = useHistory();
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    if (!localStorage.getItem("token")) history.push("/");
  }, [history]);

  return (
    <>
      <Header />
      <Box className="greeting-container">
        <h2>Yay! It's ordered 😃</h2>
        <p>You will receive an invoice for your order shortly.</p>
        <p>Your order will arrive in 7 business days.</p>
        <p id="balance-overline">Wallet Balance</p>
        <p id="balance">${localStorage.getItem("balance")} Available</p>

        {order && (
          <Box
            mt={2}
            p={2}
            sx={{
              background: "#f9f9f9",
              borderRadius: 2,
              minWidth: 300,
              textAlign: "left",
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Order Summary
            </Typography>
            <Divider />
            {order.items.map((item) => (
              <Box
                key={item.productId}
                display="flex"
                justifyContent="space-between"
                mt={1}
              >
                <Typography variant="body2">
                  {item.name} x{item.qty}
                </Typography>
                <Typography variant="body2">${item.cost * item.qty}</Typography>
              </Box>
            ))}
            <Divider sx={{ mt: 1 }} />
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography fontWeight={700}>Total</Typography>
              <Typography fontWeight={700}>${order.total}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Delivered to: {order.address}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Paid via:{" "}
              {order.paymentMethod === "card"
                ? "Credit / Debit Card"
                : "Wallet"}
            </Typography>
          </Box>
        )}

        <Box display="flex" gap={2} mt={3}>
          <Button
            variant="contained"
            size="large"
            id="continue-btn"
            onClick={() => history.push("/")}
          >
            Continue Shopping
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => history.push("/orders")}
            sx={{ borderColor: "#00a278", color: "#00a278" }}
          >
            View All Orders
          </Button>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default Thanks;
