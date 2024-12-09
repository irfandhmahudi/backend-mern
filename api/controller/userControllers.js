import User from "../models/userModels.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import sendForgotPasswordEmail from "../utils/sendForgot.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validasi role
    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

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
      role,
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
      maxAge: 1000 * 60 * 60 * 24 * 5, //5 days
    });

    if (user) {
      await sendEmail(user.email, "Verify your account", `${otp}`);
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Buat token reset password (valid hanya 1 jam)
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // Token valid selama 1 jam
    await user.save();

    // Kirim email dengan link reset password
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // const message = `Click the link below to reset your password:\n\n${resetUrl}`;

    await sendForgotPasswordEmail(user.email, `Reset Password`, resetUrl);

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
