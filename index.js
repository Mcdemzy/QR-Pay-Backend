import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();

// Middleware to parse incoming JSON
app.use(express.json());

// Enable CORS for all origins
app.use(cors());
// Or you can be more specific, only allow your frontend
app.use(cors({ origin: "http://localhost:5173" }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
