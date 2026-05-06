import { Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";

const emptyForm = { name: "", category: "", cost: "", rating: "", image: "" };

const AdminDashboard = () => {
  const token = localStorage.getItem("token");
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [allCategories, setAllCategories] = useState([]);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || localStorage.getItem("isAdmin") !== "true") {
      history.push("/");
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, ordersRes, productsRes] = await Promise.all([
        axios.get(`${config.endpoint}/admin/stats`, { headers }),
        axios.get(`${config.endpoint}/admin/users`, { headers }),
        axios.get(`${config.endpoint}/admin/orders`, { headers }),
        axios.get(`${config.endpoint}/products`, { headers }),
      ]);
      setStats(statsRes.data.stats);
      setAllUsers(usersRes.data);
      setAllOrders(ordersRes.data);
      setAllProducts(productsRes.data);
      setAllCategories([...new Set(productsRes.data.map((p) => p.category))]);
    } catch {
      enqueueSnackbar("Failed to load admin data", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteSeller = async (userId, current) => {
    try {
      await axios.patch(
        `${config.endpoint}/admin/users/${userId}/promote-seller`,
        { isSeller: !current },
        { headers },
      );
      enqueueSnackbar(
        `User ${current ? "removed from" : "promoted to"} seller`,
        { variant: "success" },
      );
      fetchAll();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    }
  };

  const handlePromoteAdmin = async (userId, current) => {
    try {
      await axios.patch(
        `${config.endpoint}/admin/users/${userId}/promote-admin`,
        { isAdmin: !current },
        { headers },
      );
      enqueueSnackbar(
        `User ${current ? "removed from" : "promoted to"} admin`,
        { variant: "success" },
      );
      fetchAll();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    }
  };

  const handleProductSubmit = async () => {
    if (
      !form.name ||
      !form.category ||
      !form.cost ||
      !form.rating ||
      !form.image
    ) {
      enqueueSnackbar("All fields are required", { variant: "warning" });
      return;
    }
    try {
      await axios.put(
        `${config.endpoint}/products/${editingProduct._id}`,
        form,
        { headers },
      );
      enqueueSnackbar("Product updated", { variant: "success" });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingProduct(null);
      fetchAll();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${config.endpoint}/products/${id}`, { headers });
      enqueueSnackbar("Product deleted", { variant: "success" });
      fetchAll();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      cost: product.cost,
      rating: product.rating,
      image: product.image,
    });
    setIsNewCategory(false);
    setDialogOpen(true);
  };

  const currentPriority = Number(localStorage.getItem("adminPriority")) || Infinity;

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box p={3} flexGrow={1}>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Admin Dashboard
        </Typography>

        {stats && (
          <Grid container spacing={2} mb={3}>
            {[
              { label: "Total Users", value: stats.totalUsers },
              { label: "Total Products", value: stats.totalProducts },
              { label: "Total Orders", value: stats.totalOrders },
              {
                label: "Total Revenue",
                value: `$${stats.totalRevenue}`,
                color: "#00a278",
              },
            ].map((s) => (
              <Grid item xs={6} md={3} key={s.label}>
                <Box
                  p={2}
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color={s.color || "inherit"}
                  >
                    {s.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        <Divider sx={{ mb: 2 }} />

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Products" />
          <Tab label="Users" />
          <Tab label="Orders" />
        </Tabs>

        {tab === 0 && (
          <Grid container spacing={2}>
            {allProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Box
                  p={2}
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography fontWeight={700}>{product.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.category}
                      </Typography>
                      <Typography variant="body2">
                        ${product.cost} · ⭐ {product.rating}
                      </Typography>
                      {product.addedBy && (
                        <Typography variant="caption" color="text.secondary">
                          By: {product.addedBy}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => openEdit(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 1 && (
          <Box>
            {allUsers.map((user) => (
              <Box
                key={user._id}
                p={2}
                mb={1}
                sx={{
                  background: "#fff",
                  borderRadius: 2,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography fontWeight={700}>{user.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5}>
                    {user.isAdmin && (
                      <Chip label={`Admin #${user.adminPriority || "?"}`} size="small" color="warning" />
                    )}
                    {user.isSeller && (
                      <Chip label="Seller" size="small" color="success" />
                    )}
                  </Box>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    color={user.isSeller ? "error" : "success"}
                    onClick={() => handlePromoteSeller(user._id, user.isSeller)}
                  >
                    {user.isSeller ? "Remove Seller" : "Make Seller"}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color={user.isAdmin ? "error" : "warning"}
                    disabled={
                      user.isAdmin &&
                      user.adminPriority != null &&
                      currentPriority >= user.adminPriority
                    }
                    onClick={() => handlePromoteAdmin(user._id, user.isAdmin)}
                  >
                    {user.isAdmin ? "Remove Admin" : "Make Admin"}
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {tab === 2 && (
          <Box>
            {allOrders.map((order) => (
              <Box
                key={order.orderId}
                p={2}
                mb={1}
                sx={{
                  background: "#fff",
                  borderRadius: 2,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight={700}>
                    @{order.username}
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
                    mt={0.5}
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
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography fontWeight={700}>Total</Typography>
                  <Typography fontWeight={700}>${order.total}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {order.address}
                  </Typography>
                  <Chip
                    label={order.paymentMethod === "card" ? "Card" : "Wallet"}
                    size="small"
                    color={
                      order.paymentMethod === "card" ? "primary" : "default"
                    }
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {["name", "image"].map((field) => (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field]: e.target.value }))
                }
                fullWidth
              />
            ))}
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={isNewCategory ? "new" : form.category}
                label="Category"
                onChange={(e) => {
                  if (e.target.value === "new") {
                    setIsNewCategory(true);
                    setForm((prev) => ({ ...prev, category: "" }));
                  } else {
                    setIsNewCategory(false);
                    setForm((prev) => ({ ...prev, category: e.target.value }));
                  }
                }}
              >
                {allCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
                <MenuItem value="new">+ Add new category</MenuItem>
              </Select>
            </FormControl>
            {isNewCategory && (
              <TextField
                label="New Category"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                fullWidth
                autoFocus
                placeholder="Enter new category name"
              />
            )}
            <Box display="flex" gap={2}>
              <TextField
                label="Cost ($)"
                type="number"
                value={form.cost}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cost: Number(e.target.value) }))
                }
                fullWidth
              />
              <TextField
                label="Rating (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={form.rating}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    rating: Number(e.target.value),
                  }))
                }
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setIsNewCategory(false); }}>Cancel</Button>
          <Button variant="contained" onClick={handleProductSubmit}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default AdminDashboard;
