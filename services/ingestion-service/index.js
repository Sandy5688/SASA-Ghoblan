import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";
import uploadRoutes from "./routes/uploadReady.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/hooks", uploadRoutes);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

async function connectWithRetry() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed, retrying in 5s...", err.message);
    setTimeout(connectWithRetry, 5000);
  }
}
connectWithRetry();
const PORT = process.env.PORT || 5000;

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Ingestion service running on port ${PORT}`);
});


