import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import fs from "fs-extra";
import path from "path";
import { uploadToAudiomack } from "./services/audiomackUploader.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Ensure logs folder exists
const logsDir = path.join(process.cwd(), "logs");
fs.ensureDirSync(logsDir);

// Upload endpoint
app.post("/upload", async (req, res) => {
  const { assetId, filePath, metadata, accountId } = req.body;

  if (!assetId || !filePath || !metadata || accountId === undefined) {
    return res.status(400).json({ error: "assetId, filePath, metadata, and accountId are required" });
  }

  try {
    const result = await uploadToAudiomack(assetId, filePath, metadata, accountId);

    // Append to log file
    const logPath = path.join(logsDir, "audiomack.log");
    fs.appendFileSync(
      logPath,
      JSON.stringify({
        platform: "audiomack",
        assetId,
        accountId,
        result,
        timestamp: new Date().toISOString(),
      }) + "\n"
    );

    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Audiomack upload error:", err.message);

    const logPath = path.join(logsDir, "audiomack.log");
    fs.appendFileSync(
      logPath,
      JSON.stringify({
        platform: "audiomack",
        assetId,
        accountId,
        status: "error",
        error: err.message,
        timestamp: new Date().toISOString(),
      }) + "\n"
    );

    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Audiomack distribution service running ✅");
});

app.get("/health", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`🚀 Audiomack service running on port ${PORT}`));