// routes/user.js
import express from "express";
import {
  updateUserProfile,
  getUserData,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Update user profile route (requires authentication)
router.put("/profile", protect, updateUserProfile);

// Fetch user data (requires authentication)
router.get("/me", protect, getUserData);

export default router;
