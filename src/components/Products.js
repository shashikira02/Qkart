import { Search, SentimentDissatisfied } from "@mui/icons-material";
import {
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
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
import "./Products.css";


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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
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
        `${config.endpoint}/products/search?value=${encodeURIComponent(text)}`
      );
      if (response.status === 200 && response.data.length > 0) {
        setFilteredProducts(response.data);
        setError(null);
      } else {
        setFilteredProducts([]);
        setError("No Products Found");
      }
    } catch (error) {
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
  const debounceSearch = (event, debounceTimeout) => {
    const searchText = event.target.value;
    clearTimeout(debounceTimeout);
    const newTimeout = setTimeout(() => {
      performSearch(searchText);
    }, 500);
    setDebounceTimeout(newTimeout);
  };

  const handleSearch = (event) => {
    const searchText = event.target.value;
    if (searchText.trim() !== "") {
      debounceSearch(event, debounceTimeout);
    } else {
      setFilteredProducts(products);
      setError(null);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        setDebounceTimeout(null);
      }
    }
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
      const completeCartItems = generateCartItemsFrom(res.data, products)
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
  }, [token , products]);



  // useEffect(() => {
  //   if (token) {
  //     fetchCart(token);
  //   }
  // }, [token]);

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
    return items.find(item => item.productId === productId) !== undefined;
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
    options = { preventDuplicate: false }
  ) => {
    if (!token) {
      enqueueSnackbar('Login to add an item to the Cart',{ variant: 'warning'})
      return;
    };
    if(options.preventDuplicate && isItemInCart(items, productId)){
      enqueueSnackbar('Item already in cart. Use the cart sidebar to update quantity or remove item.', {
        variant: 'warning'
      })
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
        }
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

  return (
    <div>
      <Header>
        {/* desktop search bar */}
        <TextField
          className="search-desktop"
          size="small"
          placeholder="Search for items/categories"
          name="search"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Search color="primary" />
              </InputAdornment>
            ),
          }}
          onChange={handleSearch}
        />
      </Header>
      {/* Search view for mobiles */}
      <TextField
        className="search-mobile"
        size="small"
        fullWidth
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
      />
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
                            handleAddToCart={()=> addToCart(token, cartItems, products, product._id, 1, {preventDuplicate: true})}
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
