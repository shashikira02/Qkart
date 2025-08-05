import { AddShoppingCartOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Rating,
  Typography,
} from "@mui/material";
import React from "react";
import { useTheme } from "@mui/material/styles";
import "./ProductCard.css";

const ProductCard = ({ product, handleAddToCart }) => {
  const theme = useTheme();
  return (
    <Card className="card">
      <CardMedia
        component="img"
        height="140"
        image={product.image}
        alt="Product image"
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {product.name}
        </Typography>
        <Typography variant="h5" sx={{ color: "black", fontWeight: "bold" }}>
          ${product.cost}
        </Typography>
      </CardContent>
      <Rating
        name="read-only"
        value={product.rating}
        precision={0.5}
        readOnly
      />
      <CardActions>
        <Button
          size="small"
          variant="contained"
          sx={{
            width: "100%",
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            justifyContent: "center", 
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              color: theme.palette.primary.contrastText,
            },
          }}
          onClick={handleAddToCart}
        >
          <AddShoppingCartOutlined /> ADD TO CART
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
