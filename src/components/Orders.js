import { CircularProgress, Divider, Typography } from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";

const Orders = () => {
  const history = useHistory();
  const token = localStorage.getItem("token");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      history.push("/login");
      return;
    }
    axios
      .get(`${config.endpoint}/user/orders`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token, history]);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box p={3} flexGrow={1}>
        <Typography variant="h4" fontWeight={700} mb={2}>
          Order History
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Typography color="text.secondary">No orders placed yet.</Typography>
        ) : (
          [...orders].reverse().map((order) => (
            <Box
              key={order.orderId}
              mb={3}
              p={2}
              sx={{
                background: "#fff",
                borderRadius: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Order ID: {order.orderId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(order.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
              </Box>
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
                  <Typography variant="body2">
                    ${item.cost * item.qty}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ mt: 1 }} />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700}>${order.total}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Delivered to: {order.address}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Paid via:{" "}
                {order.paymentMethod === "card"
                  ? "Credit / Debit Card"
                  : "Wallet"}
              </Typography>
            </Box>
          ))
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default Orders;
