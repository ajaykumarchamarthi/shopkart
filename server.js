const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const port = process.env.PORT;
const DB = process.env.DB;

mongoose
  .connect(DB)
  .then(() => console.log("Connection successful"))
  .catch((error) => console.log(error));

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
