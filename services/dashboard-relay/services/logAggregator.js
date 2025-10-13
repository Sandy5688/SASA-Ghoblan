/**
 * Enhanced Log Aggregator for Dashboard Relay
 * --------------------------------------------
 * Combines:
 *  - Log-based service status (Spotify, Apple, etc.)
 *  - MongoDB summary for ingestion + normalization pipelines
 */

import fs from "fs-extra";
import path from "path";
import { MongoClient } from "mongodb";

// Map of log file paths relative to the project
const servicesLogs = {
  spotify: "../services/spotify-service/logs/spotify.log",
  apple: "../services/apple-service/logs/apple.log",
  soundcloud: "../services/soundcloud-service/logs/soundcloud.log",
  audiomack: "../services/audiomack-service/logs/audiomack.log",
  monetization: "../services/monetization-service/logs/monetization.log",
  visual: "../services/visual-service/logs/visual.log",
};

// MongoDB URI from environment (passed in Docker Compose)
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/podcastdb";

/**
 * Helper: Reads last JSON line from a log file.
 */
function readLastLogEntry(logPath) {
  const absolutePath = path.join(process.cwd(), logPath);
  if (!fs.existsSync(absolutePath)) return "no_logs";

  const lines = fs.readFileSync(absolutePath, "utf8").split("\n").filter(Boolean);
  if (lines.length === 0) return "empty";

  try {
    const lastEntry = JSON.parse(lines[lines.length - 1]);
    return lastEntry.status || "unknown";
  } catch {
    return "parse_error";
  }
}

/**
 * Aggregates service statuses from logs and MongoDB.
 */
export const aggregateMetrics = async () => {
  const metrics = {};

  // 1️⃣ Read all service logs
  Object.entries(servicesLogs).forEach(([service, logPath]) => {
    metrics[service] = readLastLogEntry(logPath);
  });

  // 2️⃣ Try to fetch pipeline summaries from MongoDB
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db("podcastdb");

    const ingestionCount = await db.collection("ingestion_metadata").countDocuments();
    const normalizationCount = await db.collection("normalized_assets").countDocuments();

    metrics.mongoSummary = {
      connected: true,
      ingestionCount,
      normalizationCount,
    };

    await client.close();
  } catch (err) {
    metrics.mongoSummary = {
      connected: false,
      error: err.message,
    };
  }

  // 3️⃣ Timestamp for dashboard freshness
  metrics.lastUpdated = new Date().toISOString();
  return metrics;
};
