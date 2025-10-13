import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import fs from "fs-extra";
import path from "path";
import mongoose from "mongoose";
import { normalizeAudioFile } from "./services/normalizeAudio.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Ensure output folder exists
const normalizedDir = path.join(process.cwd(), "uploads", "normalized");
fs.ensureDirSync(normalizedDir);

// POST /normalize
app.post("/normalize", async (req, res) => {
  try {
    const { assetId, filePath, artworkPath } = req.body;
    if (!assetId || !filePath)
      return res.status(400).json({ error: "assetId and filePath are required" });

    const outputFile = path.join(normalizedDir, `${assetId}.mp3`);
    await normalizeAudioFile(filePath, outputFile, artworkPath);

    // Log success
    const log = {
      platform: "normalization",
      status: "success",
      assetId,
      timestamp: new Date().toISOString(),
    };
    const logPath = path.join(process.cwd(), "logs", "normalization.log");
    fs.ensureDirSync(path.dirname(logPath));
    fs.appendFileSync(logPath, JSON.stringify(log) + "\n");

    res.status(200).json({ success: true, outputFile });
  } catch (err) {
    console.error("❌ Normalization error:", err.message);
    const log = {
      platform: "normalization",
      status: "error",
      assetId: req.body.assetId,
      timestamp: new Date().toISOString(),
      error: err.message,
    };
    const logPath = path.join(process.cwd(), "logs", "normalization.log");
    fs.ensureDirSync(path.dirname(logPath));
    fs.appendFileSync(logPath, JSON.stringify(log) + "\n");
    res.status(500).json({ error: err.message });
  }
});

// --- MongoDB Connection ---
mongoose
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

// --- Routes ---
app.get("/", (req, res) => {
  res.send("🎧 Normalization service running ✅");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// --- Start Server ---
const PORT = process.env.BACKEND_PORT || 5008;
app.listen(PORT, () => {
  console.log(`🚀 Normalization service running on port ${PORT}`);
});
