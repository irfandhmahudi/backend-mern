import User from "../models/userModels.js";
import jwt, { decode } from "jsonwebtoken";
import bcrypt from "bcrypt";
import sendEmail from "../utils/sendEmail.js";
import cloudinary from "../config/cloudinary.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validasi password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Cek apakah email atau username sudah terdaftar
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email or username already exists" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Buat pengguna baru
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      otp,
    });

    // Buat JWT token
    const token = jwt.sign(
      { id: user._id, username, email },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // Simpan token ke cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    if (user) {
      await sendEmail(user.email, "Verify your account", `Your OTP is ${otp}`);
      res.status(201).json({
        success: true,
        message: "User registered. Check your email for OTP.",
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Cek apakah email terdaftar
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Periksa apakah pengguna sudah diverifikasi
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ success: false, message: "User not verified" });
    }

    // Buat JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // Simpan token di cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    // Ambil user dari req.user yang diatur oleh middleware
    const user = req.user;

    // Pastikan user ditemukan (ini biasanya sudah diverifikasi di middleware)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { otp } = req.body;

  const user = await User.findOne({ otp });

  if (user && user.otp === otp) {
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    res
      .status(200)
      .json({ success: true, data: user, message: "Account verified" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Hapus cookie
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    // Pastikan user ditemukan berdasarkan ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validasi apakah ada file yang diunggah
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    // Map file untuk mendapatkan URL dan ID dari Cloudinary dengan nama asli
    const imageUrls = await Promise.all(
      req.files.map(async (file) => {
        // Mengunggah file ke Cloudinary dengan nama asli
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "uploads", // Folder tujuan di Cloudinary
          public_id: file.originalname.split(".")[0], // Nama file tanpa ekstensi
          overwrite: true, // Overwrite jika ada file dengan nama yang sama
          resource_type: "image", // Tipe file
        });

        return {
          url: uploaded.secure_url, // URL gambar dari Cloudinary
        };
      })
    );

    // Simpan avatar ke user (gunakan URL dari gambar pertama)
    user.avatar = imageUrls[0].url;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { avatar: user.avatar }, // Kirim kembali avatar URL
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
      error: error.message,
    });
  }
};

export const getAvatar = async (req, res) => {
  try {
    // Pastikan user ditemukan berdasarkan ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Avatar retrieved successfully",
      data: { avatar: user.avatar }, // Kirim kembali avatar URL
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve avatar",
      error: error.message,
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    // Pastikan user ditemukan berdasarkan ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validasi apakah ada file yang diunggah
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    // Jika user sudah memiliki avatar sebelumnya, hapus dari Cloudinary
    if (user.avatarId) {
      await cloudinary.uploader.destroy(user.avatarId, {
        resource_type: "image", // Jenis file
      });
    }

    // Unggah file baru ke Cloudinary
    const file = req.files[0]; // Ambil file pertama (karena hanya satu avatar)
    const uploaded = await cloudinary.uploader.upload(file.path, {
      folder: "uploads", // Folder tujuan di Cloudinary
      public_id: file.originalname.split(".")[0], // Nama file tanpa ekstensi
      overwrite: true, // Ganti jika ada nama file yang sama
      resource_type: "image", // Tipe file
    });

    // Perbarui avatar URL dan avatar ID di user
    user.avatar = uploaded.secure_url; // URL gambar dari Cloudinary
    user.avatarId = uploaded.public_id; // ID file di Cloudinary
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: { avatar: user.avatar }, // Kirim kembali avatar URL
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update avatar",
      error: error.message,
    });
  }
};
