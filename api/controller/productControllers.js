import Product from "../models/productModels.js";
import cloudinary from "../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const { name, price, SKU, stock, category, description, size } = req.body;

    if (
      !name ||
      !price ||
      !SKU ||
      !stock ||
      !category ||
      !description ||
      !size
    ) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    // Konversi size ke array jika diberikan sebagai string
    const sizeArray = Array.isArray(size)
      ? size
      : typeof size === "string"
      ? size.split(",").map((s) => s.trim())
      : [];

    // Map file untuk mendapatkan URL dan ID dari Cloudinary dengan nama asli
    const imageUrls = await Promise.all(
      req.files.map(async (file) => {
        // Mengunggah file ke Cloudinary dengan nama asli

        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "uploads/products", // Folder tujuan di Cloudinary
          public_id: file.originalname.split(".")[0], // Nama file tanpa ekstensi
          resource_type: "image", // Tipe file
          overwrite: true,
        });

        return {
          url: uploaded.secure_url, // URL gambar dari Cloudinary
          originalName: file.originalname,
          publicId: uploaded.public_id,
        };
      })
    );

    const product = new Product({
      name,
      price,
      SKU,
      stock,
      category,
      description,
      images: imageUrls,
      size: sizeArray,
    });

    await product.save();

    res
      .status(201)
      .json({ success: true, message: "Product created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    const { name, price, SKU, stock, category, description, size } = req.body;

    // Hanya update field yang ada di request body
    if (name) product.name = name;
    if (price) product.price = price;
    if (SKU) product.SKU = SKU;
    if (stock) product.stock = stock;
    if (category) product.category = category;
    if (description) product.description = description;

    // Konversi size ke array jika diberikan sebagai string
    if (size !== undefined) {
      const sizeArray = Array.isArray(size)
        ? size
        : typeof size === "string"
        ? size.split(",").map((s) => s.trim())
        : [];
      product.size = sizeArray;
    }

    // Cek dan upload gambar jika ada
    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map(async (file) => {
          // Mengunggah file ke Cloudinary dengan nama asli
          const uploaded = await cloudinary.uploader.upload(file.path, {
            folder: "uploads/products", // Folder tujuan di Cloudinary
            public_id: file.originalname.split(".")[0], // Nama file tanpa ekstensi
            resource_type: "image", // Tipe file
            overwrite: true,
          });

          return {
            url: uploaded.secure_url, // URL gambar dari Cloudinary
            originalName: file.originalname,
            publicId: uploaded.public_id,
          };
        })
      );

      if (imageUrls.length > 0) product.images = imageUrls;
    }

    await product.save();

    res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    await product.remove();
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
