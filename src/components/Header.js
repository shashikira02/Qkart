import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Avatar, Button, Stack } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import "./Header.css";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";
import { config } from "../App";

const Header = ({ children, hasHiddenAuthButtons }) => {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  if (hasHiddenAuthButtons) {
    return (
      <Box className="header">
        <Box
          className="header-title"
          onClick={() => history.push("/")}
          sx={{ cursor: "pointer" }}
        >
          <img src="logo_light.svg" alt="QKart-icon"></img>
        </Box>
        <Button
          className="explore-button"
          startIcon={<ArrowBackIcon />}
          variant="text"
          onClick={() => {
            history.push("/");
          }}
        >
          Back to explore
        </Button>
      </Box>
    );
  }

  return (
    <Box className="header">
      <Box
        className="header-title"
        onClick={() => history.push("/")}
        sx={{ cursor: "pointer" }}
      >
        <img src="logo_light.svg" alt="QKart-icon"></img>
      </Box>
      {children}
      {localStorage.getItem("token") ? (
        <Stack display="flex" direction="row" alignItems="center" gap={1}>
          <Avatar src="avatar.png" alt={localStorage.getItem("username")} />
          <p>{localStorage.getItem("username")}</p>
          <Button
            variant="text"
            onClick={() => history.push("/orders")}
            sx={{ color: "#00a278" }}
          >
            Orders
          </Button>
          {localStorage.getItem("isSeller") === "true" && (
            <Button
              variant="text"
              onClick={() => history.push("/seller")}
              sx={{ color: "#00a278" }}
            >
              Seller Dashboard
            </Button>
          )}
          {localStorage.getItem("isAdmin") === "true" && (
            <Button
              variant="text"
              onClick={() => history.push("/admin")}
              sx={{ color: "#ff6b35" }}
            >
              Admin
            </Button>
          )}
          {localStorage.getItem("isSeller") !== "true" &&
            localStorage.getItem("isAdmin") !== "true" && (
              <Button
                variant="outlined"
                size="small"
                sx={{ borderColor: "#00a278", color: "#00a278" }}
                onClick={async () => {
                  try {
                    await axios.post(
                      `${config.endpoint}/user/become-seller`,
                      {},
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                      },
                    );
                    localStorage.setItem("isSeller", "true");
                    enqueueSnackbar("You are now a seller!", {
                      variant: "success",
                    });
                    window.location.reload();
                  } catch (e) {
                    enqueueSnackbar(
                      e.response?.data?.message || "Something went wrong",
                      { variant: "error" },
                    );
                  }
                }}
              >
                Become a Seller
              </Button>
            )}
          <Button
            variant="text"
            onClick={() => history.push("/wallet")}
            sx={{ color: "#00a278" }}
          >
            Wallet: ${localStorage.getItem("balance")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Logout
          </Button>
        </Stack>
      ) : (
        <Box>
          <Button
            sx={{
              mr: 1,
            }}
            variant="text"
            onClick={() => {
              history.push("/login");
            }}
          >
            Login
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              history.push("/register");
            }}
          >
            Register
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Header;
