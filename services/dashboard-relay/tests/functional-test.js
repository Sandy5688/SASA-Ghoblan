// tests/functional-test.js
import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";

const SERVICES = {
  ingestion: "http://ingestion_service:5000/health",
  normalization: "http://normalization_service:5008/health",
  dashboard: "http://dashboard_relay:5010/health",
  spotify: "http://spotify_service:5001/health",
  soundcloud: "http://soundcloud_service:5002/health",
  apple: "http://apple_service:5005/health",
  audiomack: "http://audiomack_service:5004/health",
  monetization: "http://monetization_service:5006/health",
  visual: "http://visual_service:5007/health",
  vault: "http://vault_service:5009/health",
};

async function checkHealth(name, url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (res.ok) {
      console.log(`✅ ${name} healthy`);
      return { name, status: "healthy", code: res.status, message: text };
    } else {
      console.log(`⚠️ ${name} unhealthy - Status: ${res.status}`);
      return { name, status: "unhealthy", code: res.status, message: text };
    }
  } catch (err) {
    console.log(`❌ ${name} unreachable - ${err.message}`);
    return { name, status: "unreachable", code: 0, message: err.message };
  }
}

async function runFunctionalTest() {
  console.log("🧩 Running functional tests across all services...\n");

  const results = {};
  const statuses = [];

  for (const [name, url] of Object.entries(SERVICES)) {
    const health = await checkHealth(name, url);
    results[name] = health;
    statuses.push(health.status);
  }

  const overallStatus = statuses.every((s) => s === "healthy")
    ? "healthy"
    : "issues_detected";

  const summary = {
    timestamp: new Date().toISOString(),
    overall_status: overallStatus,
    details: results,
  };

  // --- Write JSON report to logs/test-summary.json ---
  const logsDir = path.join(process.cwd(), "logs");
  await fs.ensureDir(logsDir);
  const summaryPath = path.join(logsDir, "test-summary.json");
  await fs.writeJson(summaryPath, summary, { spaces: 2 });

  console.log(`\n📄 Summary saved to logs/test-summary.json`);
  console.log(`✅ Overall status: ${overallStatus.toUpperCase()}\n`);
}

runFunctionalTest();