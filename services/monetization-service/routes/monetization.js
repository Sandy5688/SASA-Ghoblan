// services/monetization-service/routes/monetization.js
import express from "express";
import fs from "fs-extra";
import path from "path";

const router = express.Router();

router.get("/slots", async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "config", "affiliates.json");
    if (!(await fs.pathExists(configPath))) return res.json({ slots: [] });
    const json = await fs.readJson(configPath);
    res.json({ slots: json });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;