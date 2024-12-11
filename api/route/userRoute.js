import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
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

// Resend OTP
router.post("/resend-otp", resendOtp);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password/:resetToken", resetPassword);

export default router;
