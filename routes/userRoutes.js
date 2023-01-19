const express = require("express");
const router = express.Router();

const authController = require("../controller/authController");
const userController = require("../controller/userController");

// User Related Routes
router.get("/allUsers", userController.getAllUsers);

// Auth Related Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/emailVerification", authController.emailVerification);

module.exports = router;
