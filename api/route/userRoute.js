import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  verifyOtp,
  uploadAvatar,
  getAvatar,
  updateAvatar,
} from "../controller/userControllers.js";
import upload from "../middleware/uploadMiddleware.js ";
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

// Upload images
router.post(
  "/upload-avatar",
  authMiddleware,
  upload.array("images", 1),
  uploadAvatar
); // Maksimal 10 gambar

// Get avatar
router.get("/avatar", authMiddleware, getAvatar);

// Update avatar
router.patch(
  "/update-avatar",
  authMiddleware,
  upload.array("images", 1),
  updateAvatar
);

export default router;
