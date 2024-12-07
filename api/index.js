import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoutes from "./route/userRoute.js";
import cookieParser from "cookie-parser";
import avatarRoutes from "./route/avatarRoute.js";

const app = express();
dotenv.config();

connectDB();

app.use(cookieParser());

// Middleware untuk parsing body JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Jika Anda menggunakan cookies atau header khusus
  })
);

// Route for users
app.use("/api/user", userRoutes);

// Route for avatars
app.use("/api/avatar", avatarRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
