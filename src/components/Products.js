import { Search, SentimentDissatisfied } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";
import ProductCard from "./ProductCard";
import Cart, { generateCartItemsFrom } from "./Cart";
import "./Products.css";

// Definition of Data Structures used
/**
 * @typedef {Object} Product - Data on product available to buy
 *
 * @property {string} name - The name or title of the product
/**
 * @typedef {Object} CartItem -  - Data on product added to cart
 * 
 * @property {string} name - The name or title of the product in cart
 * @property {string} qty - The quantity of product added to cart
 * @property {string} category - The category that the product belongs to
 * @property {number} cost - The price to buy the product
 * @property {number} rating - The aggregate rating of the product (integer out of five)
 * @property {string} image - Contains URL for the product image
 * @property {string} productId - Unique ID for the product
 */

const Products = () => {
  /**
   * Make API call to get the products list and store it to display the products
   *
   * @returns { Array.<Product> }
   *      Array of objects with complete data on all available products
   *
   * API endpoint - "GET /products"
   *
   * Example for successful response from backend:
   * HTTP 200
   * [
   *      {
   *          "name": "iPhone XR",
   *          "category": "Phones",
   *          "cost": 100,
   *          "rating": 4,
   *          "image": "https://i.imgur.com/lulqWzW.jpg",
   *          "_id": "v4sLtEcMpzabRyfx"
   *      },
   *      {
   *          "name": "Basketball",
   *          "category": "Sports",
   *          "cost": 100,
   *          "rating": 5,
   *          "image": "https://i.imgur.com/lulqWzW.jpg",
   *          "_id": "upLK9JbQ4rMhTwt4"
   *      }
   * ]
   *
   * Example for failed response from backend:
   * HTTP 500
   * {
   *      "success": false,
   *      "message": "Something went wrong. Check the backend console for more details"
   * }
   */

  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem("productFilters");
    return saved
      ? JSON.parse(saved)
      : { category: "All", minPrice: 0, maxPrice: 2000, minRating: 0 };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggDebounce, setSuggDebounce] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeInput, setActiveInput] = useState(null); // "desktop" | "mobile" | null
  const inputRef = useRef(null);
  const [cartItems, setCartItems] = useState([]);
  const token = localStorage.getItem("token");

  const performAPICall = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.endpoint}/products`);
      if (response.status === 200) {
        setProducts(response.data);
        setFilteredProducts(response.data);
      } else {
        throw new Error("Failed to fetch products");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performAPICall();
  }, []);

  /**
   * Definition for search handler
   * This is the function that is called on adding new search keys
   *
   * @param {string} text
   *    Text user types in the search bar. To filter the displayed products based on this text.
   *
   * @returns { Array.<Product> }
   *      Array of objects with complete data on filtered set of products
   *
   * API endpoint - "GET /products/search?value=<search-query>"
   *
   */
  const performSearch = async (text) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${config.endpoint}/products/search?value=${encodeURIComponent(text)}`,
      );
      const results = response.status === 200 ? response.data : [];
      setSearchResults(results);
      setIsSearchActive(true);
      setFilteredProducts(applyFilters(results, filters));
      setError(results.length === 0 ? "No Products Found" : null);
    } catch {
      setSearchResults([]);
      setIsSearchActive(true);
      setFilteredProducts([]);
      setError("No Products Found");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Definition for debounce handler
   * With debounce, this is the function to be called whenever the user types text in the searchbar field
   *
   * @param {{ target: { value: string } }} event
   *    JS event object emitted from the search input field
   *
   * @param {NodeJS.Timeout} debounceTimeout
   *    Timer id set for the previous debounce call
   *
   */

  const fetchSuggestions = async (text) => {
    if (!text.trim()) { setSuggestions([]); return; }
    try {
      const res = await axios.get(`${config.endpoint}/products/suggestions?q=${encodeURIComponent(text)}`);
      setSuggestions(res.data);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSearch = (event) => {
    const text = event.target.value;
    setSearchText(text);

    // suggestions — 200ms debounce
    clearTimeout(suggDebounce);
    setSuggDebounce(setTimeout(() => fetchSuggestions(text), 200));

    if (text.trim() !== "") {
      clearTimeout(debounceTimeout);
      const newTimeout = setTimeout(() => performSearch(text), 500);
      setDebounceTimeout(newTimeout);
    } else {
      setIsSearchActive(false);
      setSearchResults([]);
      setFilteredProducts(applyFilters(products, filters));
      setError(null);
      setSuggestions([]);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        setDebounceTimeout(null);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchText(suggestion);
    if (inputRef.current) inputRef.current.value = suggestion;
    setSuggestions([]);
    performSearch(suggestion);
  };

  const applyFilters = useCallback((productList, activeFilters) => {
    return productList.filter((p) => {
      const categoryMatch =
        activeFilters.category === "All" ||
        p.category === activeFilters.category;
      const priceMatch =
        p.cost >= activeFilters.minPrice && p.cost <= activeFilters.maxPrice;
      const ratingMatch = p.rating >= activeFilters.minRating;
      return categoryMatch && priceMatch && ratingMatch;
    });
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = (productId, qty) => {
    addToCart(token, cartItems, products, productId, qty);
  };

  /**
   * Perform the API call to fetch the user's cart and return the response
   *
   * @param {string} token - Authentication token returned on login
   *
   * @returns { Array.<{ productId: string, qty: number }> | null }
   *    The response JSON object
   *
   * Example for successful response from backend:
   * HTTP 200
   * [
   *      {
   *          "productId": "KCRwjF7lN97HnEaY",
   *          "qty": 3
   *      },
   *      {
   *          "productId": "BW0jAAeDJmlZCF8i",
   *          "qty": 1
   *      }
   * ]
   *
   * Example for failed response from backend:
   * HTTP 401
   * {
   *      "success": false,
   *      "message": "Protected route, Oauth2 Bearer token not found"
   * }
   */

  const fetchCart = async (token) => {
    if (!token) return;

    try {
      const res = await axios.get(`${config.endpoint}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const completeCartItems = generateCartItemsFrom(res.data, products);
      setCartItems(completeCartItems);
      return res.data;
    } catch (e) {
      if (e.response && e.response.status === 400) {
        enqueueSnackbar(e.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar("Could not fetch cart details", {
          variant: "error",
        });
      }
      return null;
    }
  };
  useEffect(() => {
    if (token && products.length > 0) {
      fetchCart(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, products]);

  useEffect(() => {
    const base = isSearchActive ? searchResults : products;
    const result = applyFilters(base, filters);
    setFilteredProducts(result);
    if (base.length > 0) {
      setError(result.length === 0 ? "No Products Found" : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, products, searchResults, isSearchActive]);

  useEffect(() => {
    if (!token || products.length === 0) return;
    axios
      .get(`${config.endpoint}/user/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // collect unique productIds from all past orders, preserve order (most recent first)
        const seen = new Set();
        const uniqueIds = [];
        [...res.data].reverse().forEach((order) =>
          order.items.forEach((item) => {
            if (!seen.has(item.productId)) {
              seen.add(item.productId);
              uniqueIds.push(item.productId);
            }
          })
        );
        // match against loaded products to get full details (image, rating etc.)
        const matched = uniqueIds
          .map((id) => products.find((p) => p._id === id))
          .filter(Boolean);
        setBuyAgainProducts(matched);
      })
      .catch(() => setBuyAgainProducts([]));
  }, [token, products]);

  useEffect(() => {
    localStorage.setItem("productFilters", JSON.stringify(filters));
  }, [filters]);

  /**
   * Return if a product already is present in the cart
   *
   * @param { Array.<{ productId: String, quantity: Number }> } items
   *    Array of objects with productId and quantity of products in cart
   * @param { String } productId
   *    Id of a product to be checked
   *
   * @returns { Boolean }
   *    Whether a product of given "productId" exists in the "items" array
   *
   */
  const isItemInCart = (items, productId) => {
    return items.find((item) => item.productId === productId) !== undefined;
  };

  // useEffect(() => {
  //   const fetchAndGenerateCartItems = async () => {
  //     try {
  //       const cartData = await fetchCart(token);
  //       const completeCartItems = generateCartItemsFrom(cartData, products);
  //       setCartItems(completeCartItems);
  //     } catch (error) {
  //       console.error("Error fetching or generating cart items:", error);
  //     }
  //   };

  //   if (token && products.length > 0) {
  //     fetchAndGenerateCartItems();
  //   }
  // }, [products, token]);
  /**
   * Perform the API call to add or update items in the user's cart and update local cart data to display the latest cart
   *
   * @param {string} token
   *    Authentication token returned on login
   * @param { Array.<{ productId: String, quantity: Number }> } items
   *    Array of objects with productId and quantity of products in cart
   * @param { Array.<Product> } products
   *    Array of objects with complete data on all available products
   * @param {string} productId
   *    ID of the product that is to be added or updated in cart
   * @param {number} qty
   *    How many of the product should be in the cart
   * @param {boolean} options
   *    If this function was triggered from the product card's "Add to Cart" button
   *
   * Example for successful response from backend:
   * HTTP 200 - Updated list of cart items
   * [
   *      {
   *          "productId": "KCRwjF7lN97HnEaY",
   *          "qty": 3
   *      },
   *      {
   *          "productId": "BW0jAAeDJmlZCF8i",
   *          "qty": 1
   *      }
   * ]
   *
   * Example for failed response from backend:
   * HTTP 404 - On invalid productId
   * {
   *      "success": false,
   *      "message": "Product doesn't exist"
   * }
   */
  const addToCart = async (
    token,
    items,
    products,
    productId,
    qty,
    options = { preventDuplicate: false },
  ) => {
    if (!token) {
      enqueueSnackbar("Login to add an item to the Cart", {
        variant: "warning",
      });
      return;
    }
    if (options.preventDuplicate && isItemInCart(items, productId)) {
      enqueueSnackbar(
        "Item already in cart. Use the cart sidebar to update quantity or remove item.",
        {
          variant: "warning",
        },
      );
      return;
    }

    try {
      const res = await axios.post(
        `${config.endpoint}/cart`,
        {
          productId,
          qty,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const itemsInCart = generateCartItemsFrom(res.data, products);
      setCartItems(itemsInCart);
    } catch (e) {
      if (e.response && e.response.status === 400) {
        enqueueSnackbar(e.response.data.message, {
          variant: "error",
        });
      } else {
        enqueueSnackbar("Could not update cart.", {
          variant: "error",
        });
      }
    }
  };

  // suggestions dropdown — shared between desktop and mobile
  const SuggestionsDropdown = () =>
    suggestions.length > 0 && searchText.trim() ? (
      <Box sx={{
        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1300,
        background: "#fff", borderRadius: "0 0 8px 8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        border: "1px solid #e0e0e0", borderTop: "none",
        maxHeight: 220, overflowY: "auto",
      }}>
        {suggestions.map((s) => (
          <Box key={s}
            onMouseDown={() => handleSuggestionClick(s)}
            sx={{
              px: 2, py: 1.2, cursor: "pointer",
              fontSize: "0.875rem", textTransform: "capitalize",
              borderBottom: "1px solid #f5f5f5",
              "&:hover": { background: "#f0faf7", color: "#00a278" },
              "&:last-child": { borderBottom: "none" },
            }}
          >
            🔍 {s}
          </Box>
        ))}
      </Box>
    ) : null;

  const DesktopSuggestions = () => activeInput === "desktop" ? <SuggestionsDropdown /> : null;
  const MobileSuggestions = () => activeInput === "mobile" ? <SuggestionsDropdown /> : null;

  return (
    <div>
      <Header>
        {/* desktop search bar */}
        <Box sx={{ position: "relative", minWidth: 320 }}>
          <TextField
            className="search-desktop"
            size="small"
            fullWidth
            placeholder="Search for items/categories"
            name="search"
            value={searchText}
            inputRef={inputRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search color="primary" />
                </InputAdornment>
              ),
            }}
            onChange={handleSearch}
            onFocus={() => setActiveInput("desktop")}
            onBlur={() => setTimeout(() => { setSuggestions([]); setActiveInput(null); }, 150)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: activeInput === "desktop" && suggestions.length > 0 && searchText ? "8px 8px 0 0" : "8px" } }}
          />
          <DesktopSuggestions />
        </Box>
      </Header>

      {/* mobile search bar */}
      <Box sx={{ position: "relative" }}>
        <TextField
          className="search-mobile"
          size="small"
          fullWidth
          value={searchText}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Search color="primary" />
              </InputAdornment>
            ),
          }}
          placeholder="Search for items/categories"
          name="search"
          onChange={handleSearch}
          onFocus={() => setActiveInput("mobile")}
          onBlur={() => setTimeout(() => { setSuggestions([]); setActiveInput(null); }, 150)}
        />
        <MobileSuggestions />
      </Box>
      <Grid container>
        <Grid item className="product-grid">
          <Box className="hero">
            <p className="hero-heading">
              India’s <span className="hero-highlight">FASTEST DELIVERY</span>{" "}
              to your door step
            </p>
          </Box>
        </Grid>
      </Grid>
      <Box className="filters-container">
        {/* Category */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category}
            label="Category"
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {[...new Set(products.map((p) => p.category))].map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Price Range */}
        <Box sx={{ minWidth: 220 }}>
          <Typography className="filter-label">
            Price: ${filters.minPrice} — ${filters.maxPrice}
          </Typography>
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            min={0}
            max={2000}
            step={50}
            onChange={(e, val) =>
              setFilters((prev) => ({
                ...prev,
                minPrice: val[0],
                maxPrice: val[1],
              }))
            }
            valueLabelDisplay="auto"
            sx={{ color: "#00a278" }}
          />
        </Box>

        {/* Min Rating */}
        <Box sx={{ minWidth: 180 }}>
          <Typography className="filter-label">
            Min Rating: {filters.minRating} ★
          </Typography>
          <Slider
            value={filters.minRating}
            min={0}
            max={5}
            step={1}
            onChange={(e, val) => handleFilterChange("minRating", val)}
            valueLabelDisplay="auto"
            marks
            sx={{ color: "#00a278" }}
          />
        </Box>

        {/* Reset */}
        <Button
          className="filter-reset-btn"
          variant="outlined"
          size="small"
          onClick={() => {
            const defaultFilters = {
              category: "All",
              minPrice: 0,
              maxPrice: 2000,
              minRating: 0,
            };
            setFilters(defaultFilters);
            localStorage.removeItem("productFilters");
          }}
          sx={{
            borderColor: "#00a278",
            color: "#00a278",
            "&:hover": { borderColor: "#007a5c", color: "#007a5c" },
          }}
        >
          Reset Filters
        </Button>
      </Box>

      {token && buyAgainProducts.length > 0 && (
        <Box px={2} py={1.5}>
          <Typography variant="h6" fontWeight={700} mb={1}>Buy Again</Typography>
          <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 1 }}>
            {buyAgainProducts.map((product) => (
              <Box key={product._id} sx={{
                width: 140,
                minWidth: 140,
                maxWidth: 140,
                flexShrink: 0,
                background: "#fff",
                borderRadius: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: 80, height: 80, objectFit: "contain", flexShrink: 0 }}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=No+Image"; }}
                />
                <Typography variant="body2" fontWeight={600} textAlign="center" sx={{
                  width: "100%",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  lineHeight: 1.3,
                  minHeight: "2.6em",
                }}>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>${product.cost}</Typography>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={() => addToCart(token, cartItems, products, product._id, 1, { preventDuplicate: true })}
                  sx={{ fontSize: "0.7rem", mt: 0.5 }}
                >
                  Buy Again
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={5}>
          <CircularProgress />
          <Typography variant="body1" ml={2}>
            Loading Products
          </Typography>
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={5}>
          <SentimentDissatisfied color="error" />
          <Typography variant="body1" ml={2} color="error">
            {error}
          </Typography>
        </Box>
      ) : (
        <Grid container>
          <Grid container>
            {token ? (
              <Grid container>
                <Grid item xs={12} md={9}>
                  <Grid container spacing={2} mt={2}>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <Grid item xs={12} sm={6} md={3} key={product._id}>
                          <ProductCard
                            product={product}
                            handleAddToCart={() =>
                              addToCart(
                                token,
                                cartItems,
                                products,
                                product._id,
                                1,
                                { preventDuplicate: true },
                              )
                            }
                          />
                        </Grid>
                      ))
                    ) : (
                      <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        mt={5}
                      >
                        <SentimentDissatisfied color="error" />
                        <Typography variant="body1" ml={2} color="error">
                          No Products Found
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Cart
                    products={products}
                    items={cartItems}
                    handleQuantity={addToCart}
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2} mt={2}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={3} key={product._id}>
                      <ProductCard
                        product={product}
                        handleAddToCart={handleAddToCart}
                      />
                    </Grid>
                  ))
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    mt={5}
                  >
                    <SentimentDissatisfied color="error" />
                    <Typography variant="body1" ml={2} color="error">
                      No Products Found
                    </Typography>
                  </Box>
                )}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      <Footer />
    </div>
  );
};

export default Products;
