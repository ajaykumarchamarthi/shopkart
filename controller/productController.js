const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");

exports.createProduct = catchAsync(async (req, res, next) => {
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      product: newProduct,
    },
  });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  let query = Product.find();

  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query.sort(sortBy);
  }

  const products = await query;

  res.status(200).json({
    status: "success",
    data: {
      products,
    },
  });
});
