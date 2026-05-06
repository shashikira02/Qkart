import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Box, Button, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { config } from "../App";
import Header from "./Header";
import Footer from "./Footer";

const WalletTopup = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { enqueueSnackbar } = useSnackbar();
  const history = useHistory();
  const token = localStorage.getItem("token");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (!token) history.push("/login");
  }, [token, history]);

  const handleProceed = () => {
    if (!amount || Number(amount) < 1)
      return enqueueSnackbar("Enter a valid amount", { variant: "warning" });
    setShowCard(true);
  };

  const handleTopup = async () => {
    setProcessing(true);
    try {
      const intentRes = await axios.post(
        `${config.endpoint}/payment/topup`,
        { amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentRes.data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement) } },
      );

      if (error) {
        enqueueSnackbar(error.message, { variant: "error" });
        return;
      }

      const confirmRes = await axios.post(
        `${config.endpoint}/payment/topup/confirm`,
        { paymentIntentId: paymentIntent.id, amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      localStorage.setItem("balance", confirmRes.data.newBalance);
      enqueueSnackbar(`$${amount} added to your wallet!`, {
        variant: "success",
      });
      setAmount("");
      setShowCard(false);
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box p={3} maxWidth={420} mx="auto" flexGrow={1} mt={4}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Top Up Wallet
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Current Balance: ${localStorage.getItem("balance")}
        </Typography>

        <TextField
          label="Amount ($)"
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setShowCard(false);
          }}
          fullWidth
          inputProps={{ min: 1, max: 10000 }}
          sx={{ mb: 2 }}
        />

        {!showCard ? (
          <Button variant="contained" fullWidth onClick={handleProceed}>
            Proceed to Pay
          </Button>
        ) : (
          <Box>
            <Box
              p={2}
              sx={{ border: "1px solid #e0e0e0", borderRadius: 2, mb: 1 }}
            >
              <CardElement />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={2}
            >
              Test card: 4242 4242 4242 4242 | Any future date | Any CVC
            </Typography>
            <Button
              variant="contained"
              fullWidth
              disabled={processing || !stripe}
              onClick={handleTopup}
            >
              {processing ? "Processing..." : `Add $${amount} to Wallet`}
            </Button>
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default WalletTopup;
