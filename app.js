const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the Shopkart",
  });
});

module.exports = app;
