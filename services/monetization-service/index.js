import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import fs from "fs-extra";
import path from "path";

import { generateAffiliateSlot } from "./services/affiliateManager.js";
import { pickSponsoredSegment } from "./services/sponsorshipManager.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const logsDir = path.join(process.cwd(), "logs");
fs.ensureDirSync(logsDir);

// Dummy config
const affiliateConfig = {
  slots: [
    { id: 1, link: "https://example.com/affiliate1", geo: ["US","EU"], time: { start: 8, end: 20 } },
    { id: 2, link: "https://example.com/affiliate2", geo: ["APAC"], time: { start: 9, end: 18 } }
  ]
};

const sponsoredSegments = [
  { id: 1, content: "Sponsor A mid-playlist ad", geo: ["US","EU"] },
  { id: 2, content: "Sponsor B mid-playlist ad", geo: ["APAC"] }
];

// POST /monetization/pick-slot
app.post("/pick-affiliate", (req, res) => {
  const { userGeo } = req.body;
  const slot = generateAffiliateSlot(affiliateConfig, userGeo);
  const status = slot ? "ok" : "none_available";
  fs.appendFileSync(path.join(logsDir, "monetization.log"), JSON.stringify({ type: "affiliate", status, slot, timestamp: new Date().toISOString() }) + "\n");
  res.json({ slot, status });
});

// POST /monetization/pick-segment
app.post("/pick-segment", (req, res) => {
  const { userGeo } = req.body;
  const segment = pickSponsoredSegment(sponsoredSegments, userGeo);
  const status = segment ? "ok" : "none_available";
  fs.appendFileSync(path.join(logsDir, "monetization.log"), JSON.stringify({ type: "sponsorship", status, segment, timestamp: new Date().toISOString() }) + "\n");
  res.json({ segment, status });
});

const PORT = process.env.BACKEND_PORT || 5006;
app.get('/', (req, res) => {
  res.send('Monetization engine running ✅');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => console.log(`🚀 Monetization service running on port ${PORT}`));
