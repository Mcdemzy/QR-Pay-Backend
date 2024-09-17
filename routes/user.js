// routes/user.js
import express from "express";
import { updateUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// Update user profile route (requires authentication)
router.put("/profile", protect, updateUserProfile);

export default router;
