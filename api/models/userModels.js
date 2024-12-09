import mongoose from "mongoose";

const cartItemSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, default: 1 },
    size: { type: String, required: true }, // Menambahkan ukuran
  },
  {
    timestamps: true,
  }
);

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String }, // URL gambar di Cloudinary
    otp: { type: String },
    role: { type: String, default: "user" },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    cart: [cartItemSchema], // Keranjang pengguna dengan properti size
    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
