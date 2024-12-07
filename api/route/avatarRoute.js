import express from "express";
import {
  uploadAvatar,
  getAvatar,
  updateAvatar,
} from "../controller/avatarController.js";
import upload from "../middleware/uploadMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload images
router.post("/upload", authMiddleware, upload.array("images", 1), uploadAvatar); // Maksimal 10 gambar

// Get avatar
router.get("/get", authMiddleware, getAvatar);

// Update avatar
router.patch(
  "/update",
  authMiddleware,
  upload.array("images", 1),
  updateAvatar
);

export default router;
