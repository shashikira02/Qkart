import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import { Avatar, Button, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Stack } from "@mui/material";
import Box from "@mui/material/Box";
import React, { useState } from "react";
import "./Header.css";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";
import { config } from "../App";

const Header = ({ children, hasHiddenAuthButtons }) => {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const isSeller = localStorage.getItem("isSeller") === "true";
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const balance = localStorage.getItem("balance");

  const handleBecomeSeller = async () => {
    try {
      await axios.post(
        `${config.endpoint}/user/become-seller`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      localStorage.setItem("isSeller", "true");
      enqueueSnackbar("You are now a seller!", { variant: "success" });
      window.location.reload();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || "Something went wrong", { variant: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const DrawerMenu = () => (
    <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
      <Box sx={{ width: 240 }} onClick={() => setDrawerOpen(false)}>
        {token ? (
          <List>
            <ListItem>
              <Avatar src="avatar.png" alt={username} sx={{ mr: 1 }} />
              <ListItemText primary={username} />
            </ListItem>
            <Divider />
            <ListItemButton onClick={() => history.push("/orders")}>
              <ListItemText primary="Orders" />
            </ListItemButton>
            <ListItemButton onClick={() => history.push("/wallet")}>
              <ListItemText primary={`Wallet: $${balance}`} />
            </ListItemButton>
            {isSeller && (
              <ListItemButton onClick={() => history.push("/seller")}>
                <ListItemText primary="Seller Dashboard" />
              </ListItemButton>
            )}
            {isAdmin && (
              <ListItemButton onClick={() => history.push("/admin")}>
                <ListItemText primary="Admin" sx={{ color: "#ff6b35" }} />
              </ListItemButton>
            )}
            {!isSeller && !isAdmin && (
              <ListItemButton onClick={handleBecomeSeller}>
                <ListItemText primary="Become a Seller" />
              </ListItemButton>
            )}
            <Divider />
            <ListItem>
              <Button fullWidth variant="contained" onClick={handleLogout}>Logout</Button>
            </ListItem>
          </List>
        ) : (
          <List>
            <ListItem>
              <Button fullWidth variant="text" onClick={() => history.push("/login")}>Login</Button>
            </ListItem>
            <ListItem>
              <Button fullWidth variant="contained" onClick={() => history.push("/register")}>Register</Button>
            </ListItem>
          </List>
        )}
      </Box>
    </Drawer>
  );

  if (hasHiddenAuthButtons) {
    return (
      <Box className="header">
        <Box className="header-title" onClick={() => history.push("/")} sx={{ cursor: "pointer" }}>
          <img src="logo_light.svg" alt="QKart-icon" />
        </Box>
        <Button className="explore-button" startIcon={<ArrowBackIcon />} variant="text" onClick={() => history.push("/")}>
          Back to explore
        </Button>
      </Box>
    );
  }

  return (
    <Box className="header">
      <Box className="header-title" onClick={() => history.push("/")} sx={{ cursor: "pointer" }}>
        <img src="logo_light.svg" alt="QKart-icon" />
      </Box>

      {/* Hide search/children on mobile */}
      <Box sx={{ display: { xs: "none", md: "block" }, flexGrow: 1, mx: 2 }}>
        {children}
      </Box>

      {/* Desktop nav */}
      <Stack direction="row" alignItems="center" gap={1} sx={{ display: { xs: "none", md: "flex" } }}>
        {token ? (
          <>
            <Avatar src="avatar.png" alt={username} />
            <p>{username}</p>
            <Button variant="text" onClick={() => history.push("/orders")} sx={{ color: "#00a278" }}>Orders</Button>
            {isSeller && (
              <Button variant="text" onClick={() => history.push("/seller")} sx={{ color: "#00a278" }}>Seller Dashboard</Button>
            )}
            {isAdmin && (
              <Button variant="text" onClick={() => history.push("/admin")} sx={{ color: "#ff6b35" }}>Admin</Button>
            )}
            {!isSeller && !isAdmin && (
              <Button variant="outlined" size="small" sx={{ borderColor: "#00a278", color: "#00a278" }} onClick={handleBecomeSeller}>
                Become a Seller
              </Button>
            )}
            <Button variant="text" onClick={() => history.push("/wallet")} sx={{ color: "#00a278" }}>Wallet: ${balance}</Button>
            <Button variant="contained" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Button variant="text" onClick={() => history.push("/login")}>Login</Button>
            <Button variant="contained" onClick={() => history.push("/register")}>Register</Button>
          </>
        )}
      </Stack>

      {/* Mobile hamburger */}
      <IconButton sx={{ display: { xs: "flex", md: "none" } }} onClick={() => setDrawerOpen(true)}>
        <MenuIcon />
      </IconButton>

      <DrawerMenu />
    </Box>
  );
};

export default Header;
