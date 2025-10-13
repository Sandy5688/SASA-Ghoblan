import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { uploadToSpotify } from "./services/spotifyUploader.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), "logs");
fs.ensureDirSync(logsDir);

const DEMO_MODE = process.env.SPOTIFY_DEMO_MODE === "true";

// --- Upload Route ---
app.post("/upload", async (req, res) => {
  const { assetId, filePath, metadata, accountId } = req.body;

  if (!assetId || !filePath || !metadata || accountId === undefined) {
    return res.status(400).json({ error: "assetId, filePath, metadata, accountId required" });
  }

  try {
    const result = await uploadToSpotify(assetId, filePath, metadata, accountId);

    // --- Log locally ---
    const logPath = path.join(logsDir, "spotify.log");
    fs.appendFileSync(logPath, JSON.stringify({ ...result, timestamp: new Date().toISOString() }) + "\n");

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Spotify service error:", err.message);
    fs.appendFileSync(
      path.join(logsDir, "spotify.log"),
      JSON.stringify({ platform: "spotify", error: err.message, timestamp: new Date().toISOString() }) + "\n"
    );
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) =>
  res.send(`🎧 Spotify distribution service (${DEMO_MODE ? "Demo Mode" : "Live Mode"}) ✅`)
);
app.get("/health", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Spotify service running on port ${PORT} (${DEMO_MODE ? "Demo" : "Live"})`));
