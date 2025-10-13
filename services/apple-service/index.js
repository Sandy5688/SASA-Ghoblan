import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import fs from "fs-extra";
import path from "path";
import { uploadToApple } from "./services/appleUploader.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Logs folder
const logsDir = path.join(process.cwd(), "logs");
fs.ensureDirSync(logsDir);

// POST /upload
app.post("/upload", async (req, res) => {
  const { assetId, filePath, metadata, accountId } = req.body;

  if (!assetId || !filePath || !metadata || accountId === undefined) {
    return res.status(400).json({ error: "assetId, filePath, metadata, accountId required" });
  }

  try {
    const result = await uploadToApple(assetId, filePath, metadata, accountId);

    // Log
    const logPath = path.join(logsDir, "apple.log");
    fs.appendFileSync(
      logPath,
      JSON.stringify({ platform: "apple", assetId, accountId, result, timestamp: new Date().toISOString() }) + "\n"
    );

    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Apple upload error:", err.message);
    const logPath = path.join(logsDir, "apple.log");
    fs.appendFileSync(
      logPath,
      JSON.stringify({ platform: "apple", assetId, accountId, status: "error", error: err.message, timestamp: new Date().toISOString() }) + "\n"
    );
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Apple RSS distribution service running ✅");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.BACKEND_PORT || 5005;
app.listen(PORT, () => console.log(`🚀 Apple service running on port ${PORT}`));