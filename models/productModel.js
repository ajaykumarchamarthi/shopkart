const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product must have a name"],
  },
  price: {
    type: Number,
    required: [true, "Product must have a price"],
  },
  category: {
    type: String,
    required: [true, "Product must have a category"],
  },
  in_stock: {
    type: Boolean,
    required: [true, "Stock availability must be specified"],
    default: true,
  },
  brand: {
    type: String,
    required: [true, "Product must have a brand"],
  },
  description: {
    type: String,
    required: [true, "Product must have a description"],
  },
  images: [
    {
      type: String,
      required: [true, "Product must have image"],
    },
  ],
  gender: {
    type: String,
    required: [true, "Product must have a gender"],
    enum: ["Men", "Women", "Unisex"],
    default: "Men",
  },
});

const Products = mongoose.model("Product", productSchema);
module.exports = Products;
