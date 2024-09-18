// routes/auth.js
import express from "express";
import {
  registerUser,
  loginUser,
  verifyOTP,
} from "../controllers/authController.js";
const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// VerifyOTP Route
router.post("/verify-otp", verifyOTP);

export default router;
