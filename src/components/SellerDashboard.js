import { Add, Delete, Edit } from "@mui/icons-material";
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
  TextField,
  Typography,
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

const SellerDashboard = () => {
  const token = localStorage.getItem("token");
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [allCategories, setAllCategories] = useState([]);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      history.push("/login");
      return;
    }
    fetchMyProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.endpoint}/products/my-products`, {
        headers,
      });
      setProducts(res.data.products);
      const productsRes = await axios.get(`${config.endpoint}/products`);
      const cats = [...new Set(productsRes.data.map((p) => p.category))];
      setAllCategories(cats);
      setTotalRevenue(res.data.totalRevenue);
    } catch {
      enqueueSnackbar("Could not fetch your products", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
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
      if (editingProduct) {
        await axios.put(
          `${config.endpoint}/products/${editingProduct._id}`,
          form,
          { headers },
        );
        enqueueSnackbar("Product updated", { variant: "success" });
      } else {
        await axios.post(`${config.endpoint}/products`, form, { headers });
        enqueueSnackbar("Product added", { variant: "success" });
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingProduct(null);
      fetchMyProducts();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${config.endpoint}/products/${id}`, { headers });
      enqueueSnackbar("Product deleted", { variant: "success" });
      fetchMyProducts();
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

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsNewCategory(false);
    setDialogOpen(true);
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box p={3} flexGrow={1}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" fontWeight={700}>
            Seller Dashboard
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
            Add Product
          </Button>
        </Box>

        {/* Revenue Summary */}
        <Box display="flex" gap={3} mb={3}>
          <Box
            p={2}
            sx={{
              background: "#fff",
              borderRadius: 2,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              minWidth: 160,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total Products
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {products.length}
            </Typography>
          </Box>
          <Box
            p={2}
            sx={{
              background: "#fff",
              borderRadius: 2,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              minWidth: 160,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total Revenue
            </Typography>
            <Typography variant="h5" fontWeight={700} color="#00a278">
              ${totalRevenue}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Typography color="text.secondary">
            No products added yet. Click "Add Product" to get started.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {products.map((product) => (
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
                      <Typography
                        variant="body2"
                        color="#00a278"
                        fontWeight={700}
                        mt={0.5}
                      >
                        Revenue: ${product.revenue}
                      </Typography>
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
                        onClick={() => handleDelete(product._id)}
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
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingProduct ? "Edit Product" : "Add Product"}
        </DialogTitle>
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
          <Button variant="contained" onClick={handleSubmit}>
            {editingProduct ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default SellerDashboard;
