// routes/auth.js
import express from "express";
import {
  registerUser,
  loginUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// VerifyOTP Route
router.post("/verify-otp", verifyOTP);

// ForgotPassword Route
router.post("/forgot-password", forgotPassword);

// ResetPassword Route
router.post("/reset-password/:token", resetPassword);

export default router;
