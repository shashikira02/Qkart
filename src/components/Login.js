import { Button, CircularProgress, Stack, TextField } from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";
import "./Login.css";

const Login = () => {
  const { enqueueSnackbar } = useSnackbar();
  const history = useHistory();

  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const changeFunction = ({ target }) => {
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  if (localStorage.getItem("token")) {
    history.push("/");
  }

  /**
   * Perform the Login API call
   * @param {{ username: string, password: string }} formData
   *  Object with values of username, password and confirm password user entered to register
   *
   * API endpoint - "POST /auth/login"
   *
   * Example for successful response from backend:
   * HTTP 201
   * {
   *      "success": true,
   *      "token": "testtoken",
   *      "username": "criodo",
   *      "balance": 5000
   * }
   *
   * Example for failed response from backend:
   * HTTP 400
   * {
   *      "success": false,
   *      "message": "Password is incorrect"
   * }
   *
   */
  // "hello"
  const login = async (formData) => {
    if (validateInput(formData)) {
      try {
        setIsLogin(true);
        const response = await axios.post(config.endpoint + "/auth/login", {
          username: formData.username,
          password: formData.password,
        });
        console.log(response.data);
        const { token, username, balance, isSeller, isAdmin, adminPriority } = response.data;
        persistLogin(token, username, balance, isSeller, isAdmin, adminPriority);
        enqueueSnackbar("Logged in Successfully", {
          variant: "success",
        });
        history.push("/");
      } catch (error) {
        if (error.response && error.response.status === 400) {
          enqueueSnackbar(error.response.data.message, {
            variant: "error",
          });
        } else if (error.response && error.response.status === 429) {
          enqueueSnackbar(error.response.data.message, { variant: "warning" });
        } else {
          console.error(error);
          enqueueSnackbar(
            "Something went wrong. Check that the backend is running, reachable and returns valid JSON.",
            {
              variant: "error",
            },
          );
        }
      } finally {
        setIsLogin(false);
      }
    }
  };

  /**
   * Validate the input values so that any bad or illegal values are not passed to the backend.
   *
   * @param {{ username: string, password: string }} data
   *  Object with values of username, password and confirm password user entered to register
   *
   * @returns {boolean}
   *    Whether validation has passed or not
   *
   * Return false and show warning message if any validation condition fails, otherwise return true.
   * (NOTE: The error messages to be shown for each of these cases, are given with them)
   * -    Check that username field is not an empty value - "Username is a required field"
   * -    Check that password field is not an empty value - "Password is a required field"
   */
  const validateInput = (data) => {
    if (!data.username) {
      enqueueSnackbar("Username is a required field", { variant: "warning" });
      return false;
    }
    if (!data.password) {
      enqueueSnackbar("Password is a required field", { variant: "warning" });
      return false;
    }
    return true;
  };

  /**
   * Store the login information so that it can be used to identify the user in subsequent API calls
   *
   * @param {string} token
   *    API token used for authentication of requests after logging in
   * @param {string} username
   *    Username of the logged in user
   * @param {string} balance
   *    Wallet balance amount of the logged in user
   *
   * Make use of localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
   * -    `token` field in localStorage can be used to store the Oauth token
   * -    `username` field in localStorage can be used to store the username that the user is logged in as
   * -    `balance` field in localStorage can be used to store the balance amount in the user's wallet
   */
  const persistLogin = (token, username, balance, isSeller, isAdmin, adminPriority) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("balance", balance);
    localStorage.setItem("isSeller", isSeller);
    localStorage.setItem("isAdmin", isAdmin);
    localStorage.setItem("adminPriority", adminPriority || "");
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      minHeight="100vh"
    >
      <Header hasHiddenAuthButtons={true} />
      <Box className="content">
        <Stack spacing={2} className="form">
          <h2 className="title">Login</h2>
          <TextField
            id="username"
            label="Username or Email"
            variant="outlined"
            title="Username"
            name="username"
            placeholder="Enter Username or Email"
            fullWidth
            value={formData.username}
            onChange={changeFunction}
          />
          <TextField
            id="password"
            variant="outlined"
            label="Password"
            name="password"
            type="password"
            helperText="Password must be at least 6 characters"
            fullWidth
            placeholder="Enter a password with minimum 6 characters"
            value={formData.password}
            onChange={changeFunction}
          />
          {isLogin ? (
            <Box display="flex" justifyContent="center" alignItems="center">
              <CircularProgress size={25} color="primary" />
            </Box>
          ) : (
            <Button
              className="button"
              variant="contained"
              onClick={() => {
                login(formData);
              }}
            >
              Login to Qkart
            </Button>
          )}
          <p className="secondary-action">
            Don't have an account?{" "}
            <Link to="/register" className="link">
              Register now
            </Link>
            {" | "}
            <Link to="/forgot-password" className="link">
              Forgot Password?
            </Link>
          </p>
        </Stack>
      </Box>
      <Footer />
    </Box>
  );
};

export default Login;
