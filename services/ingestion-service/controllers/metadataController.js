import Metadata from "../models/metadataModel.js";
import fs from "fs";
import path from "path";

// Helper to log events
function logEvent(event) {
  const logPath = path.join(process.cwd(), "logs", "ingestion.log");
  fs.appendFileSync(logPath, JSON.stringify(event) + "\n");
}

// POST /hooks/upload_ready
export const uploadMetadata = async (req, res) => {
  try {
    const { assetId, metadata } = req.body;

    if (!assetId || !metadata) {
      return res.status(400).json({ error: "assetId and metadata are required" });
    }

    // Ensure default "en" exists
    metadata.title = metadata.title || {};
    metadata.description = metadata.description || {};
    metadata.tags = metadata.tags || {};
    metadata.transcript = metadata.transcript || {};

    if (!metadata.title.en) metadata.title.en = "Untitled";
    if (!metadata.description.en) metadata.description.en = "";

    const doc = await Metadata.findOneAndUpdate(
      { assetId },
      { metadata },
      { upsert: true, new: true }
    );

    // Log
    logEvent({ platform: "ingestion", status: "success", assetId, timestamp: new Date().toISOString() });

    res.status(200).json({ success: true, asset: doc });
  } catch (err) {
    console.error("❌ Upload metadata error:", err);
    logEvent({ platform: "ingestion", status: "error", assetId: req.body.assetId, timestamp: new Date().toISOString(), error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// GET /metadata/:assetId
export const getMetadata = async (req, res) => {
  try {
    const { assetId } = req.params;
    const doc = await Metadata.findOne({ assetId });
    if (!doc) return res.status(404).json({ error: "Asset not found" });

    res.status(200).json(doc);
  } catch (err) {
    console.error("❌ Get metadata error:", err);
    res.status(500).json({ error: err.message });
  }
};
