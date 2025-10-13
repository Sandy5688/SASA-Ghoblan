import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import fs from "fs-extra";
import path from "path";
import { generateCoverArt } from "./services/coverArtManager.js";
import { generateOverlay } from "./services/overlayManager.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const logsDir = path.join(process.cwd(), "logs");
fs.ensureDirSync(logsDir);

// POST /visuals/cover
app.post("/cover", async (req, res) => {
  const { assetId } = req.body;
  if (!assetId) return res.status(400).json({ error: "assetId required" });

  try {
    const cover = await generateCoverArt(assetId);
    fs.appendFileSync(path.join(logsDir, "visual.log"), JSON.stringify({ type: "cover", assetId, cover, timestamp: new Date().toISOString() }) + "\n");
    res.json({ success: true, cover });
  } catch (err) {
    console.error("❌ Cover generation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /visuals/overlay
app.post("/overlay", async (req, res) => {
  const { assetId } = req.body;
  if (!assetId) return res.status(400).json({ error: "assetId required" });

  try {
    const overlay = await generateOverlay(assetId);
    fs.appendFileSync(path.join(logsDir, "visual.log"), JSON.stringify({ type: "overlay", assetId, overlay, timestamp: new Date().toISOString() }) + "\n");
    res.json({ success: true, overlay });
  } catch (err) {
    console.error("❌ Overlay generation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.BACKEND_PORT || 5007;
app.get('/', (req, res) => {
  res.send('Visual analytics service running ✅');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => console.log(`🚀 Visual service running on port ${PORT}`));
