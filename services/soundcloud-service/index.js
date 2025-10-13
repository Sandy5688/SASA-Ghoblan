import express from "express";
import path from "path";
import fs from "fs";
import { uploadToSoundCloud } from "./services/soundcloudUploader.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5002;
const LOGS_DIR = process.env.LOGS_DIR || "./logs";

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

app.get("/health", (req, res) => res.status(200).send("OK"));

/**
 * Upload route — triggered by dashboard or pipeline
 */
app.post("/upload", async (req, res) => {
  const { assetId, filePath, metadata, accountId } = req.body;

  if (!assetId || !filePath || !accountId) {
    return res.status(400).json({ error: "assetId, filePath, accountId required" });
  }

  const result = await uploadToSoundCloud(assetId, filePath, metadata || {}, accountId);
  const logMsg = `${new Date().toISOString()} | ${assetId} | Account ${accountId} | Result: ${result}\n`;
  fs.appendFileSync(path.join(LOGS_DIR, "soundcloud.log"), logMsg);

  console.log(logMsg.trim());
  res.json({ platform: "soundcloud", status: result });
});

app.listen(PORT, () => {
  console.log(`🚀 SoundCloud service running on port ${PORT}`);
  console.log(`📦 Logs directory: ${LOGS_DIR}`);
});