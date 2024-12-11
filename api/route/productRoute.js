import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controller/productControllers.js";
import upload from "../middleware/uploadProduct.js";
import express from "express";

const router = express.Router();

// Create product
router.post("/create", upload.array("images", 10), createProduct);

// Get all products
router.get("/all", getAllProducts);

// Get product by ID
router.get("/:id", getProductById);

// Update product
router.patch("/:id", upload.array("images", 10), updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

export default router;
