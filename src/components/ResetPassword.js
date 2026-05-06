import { Button, CircularProgress, Stack, TextField } from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useHistory, useLocation, Link } from "react-router-dom";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";

const ResetPassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const history = useHistory();
  const query = new URLSearchParams(useLocation().search);
  const token = query.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      enqueueSnackbar("All fields are required", { variant: "warning" });
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 32) {
      enqueueSnackbar("Password must be between 6 and 32 characters", { variant: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      enqueueSnackbar("Passwords do not match", { variant: "warning" });
      return;
    }
    try {
      setIsSubmitting(true);
      await axios.post(config.endpoint + "/auth/reset-password", { token, newPassword });
      enqueueSnackbar("Password reset successful. Please login.", { variant: "success" });
      history.push("/login");
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
          <h2 className="title">Reset Password</h2>
          <TextField
            label="New Password"
            variant="outlined"
            type="password"
            fullWidth
            helperText="Password must be between 6 and 32 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirm Password"
            variant="outlined"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {isSubmitting ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={25} />
            </Box>
          ) : (
            <Button variant="contained" onClick={handleSubmit}>
              Reset Password
            </Button>
          )}
          <p className="secondary-action">
            <Link to="/login" className="link">Back to Login</Link>
          </p>
        </Stack>
      </Box>
      <Footer />
    </Box>
  );
};

export default ResetPassword;
