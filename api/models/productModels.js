import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    SKU: {
      type: String,
      required: true,
      unique: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        originalName: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    size: {
      type: [String],
      required: false,
      default: [],
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
