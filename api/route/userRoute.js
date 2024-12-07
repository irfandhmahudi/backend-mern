import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  verifyOtp,
} from "../controller/userControllers.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Get current user
router.get("/me", authMiddleware, getMe);

// Logout
router.post("/logout", logoutUser);

// Verify OTP
router.post("/verify-otp", verifyOtp);

export default router;
