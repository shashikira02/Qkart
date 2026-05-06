import { Button, CircularProgress, Stack, TextField } from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { Link } from "react-router-dom";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";

const ForgotPassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username) {
      enqueueSnackbar("Username is required", { variant: "warning" });
      return;
    }
    try {
      setIsSubmitting(true);
      await axios.post(config.endpoint + "/auth/forgot-password", { username });
      enqueueSnackbar("Password reset email sent. Check your inbox.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Something went wrong",
        { variant: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" justifyContent="space-between" minHeight="100vh">
      <Header hasHiddenAuthButtons />
      <Box className="content">
        <Stack spacing={2} className="form">
          <h2 className="title">Forgot Password</h2>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
          {isSubmitting ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={25} />
            </Box>
          ) : (
            <Button variant="contained" onClick={handleSubmit}>
              Send Reset Email
            </Button>
          )}
          <p className="secondary-action">
            Remember your password? <Link to="/login" className="link">Login here</Link>
          </p>
        </Stack>
      </Box>
      <Footer />
    </Box>
  );
};

export default ForgotPassword;
