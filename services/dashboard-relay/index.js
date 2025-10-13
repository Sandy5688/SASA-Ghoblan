import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra"; // for reading JSON files safely

import testStatusRouter from "./routes/testStatus.js";
import { aggregateMetrics } from "./services/logAggregator.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/metrics", testStatusRouter);

// --- Metrics Endpoints ---

// GET /metrics/streaming
app.get("/metrics/streaming", (req, res) => {
  const metrics = aggregateMetrics();
  res.json(metrics);
});

// GET /metrics/monetization
app.get("/metrics/monetization", (req, res) => {
  const metrics = aggregateMetrics();
  const monetizationMetrics = {
    monetization: metrics.monetization || "unknown",
    visual: metrics.visual || "unknown",
    lastUpdated: metrics.lastUpdated,
  };
  res.json(monetizationMetrics);
});

// ✅ Combined Metrics (Main Endpoint)
app.get("/metrics/all", async (req, res) => {
  try {
    const metrics = aggregateMetrics();

    const logsDir = path.join(process.cwd(), "logs");

    // --- Integration test summary ---
    const integrationSummaryPath = path.join(logsDir, "test-summary.json");
    if (fs.existsSync(integrationSummaryPath)) {
      const integrationSummary = await fs.readJson(integrationSummaryPath);
      metrics.integration_test = integrationSummary;
    }

    // --- Platform test summary ---
    const platformSummaryPath = path.join(logsDir, "platform-test-summary.json");
    if (fs.existsSync(platformSummaryPath)) {
      const platformSummary = await fs.readJson(platformSummaryPath);
      metrics.platform_test = platformSummary;
    }

    res.json(metrics);
  } catch (err) {
    console.error("Error fetching metrics:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- MongoDB Connection ---
async function connectWithRetry() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Mongo connection failed, retrying in 5s...", err);
    setTimeout(connectWithRetry, 5000);
  }
}

connectWithRetry();

// --- Routes ---
app.get("/", (req, res) => {
  res.send("📊 Dashboard relay service running ✅");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// --- Start Server ---
const PORT = process.env.BACKEND_PORT || 5010;

app.listen(PORT, () => {
  console.log('🚀 Dashboard Relay running on port ${PORT}');
});