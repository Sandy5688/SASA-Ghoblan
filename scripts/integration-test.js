// 🧩 Auto-install missing dependencies before running tests
import { execSync } from "child_process";

const requiredPackages = ["mongodb", "node-fetch", "fs-extra", "path"];
for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
  } catch {
    console.log(`📦 Installing missing dependency: ${pkg}...`);
    execSync(`npm install ${pkg}`, { stdio: "inherit" });
  }
}

// 🧠 Now import actual dependencies
import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import fs from "fs-extra";
import path from "path";

const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "podcastdb";
const TEST_ASSET_ID = "test001";
const UPLOADS_PATH = path.resolve("./uploads");
const LOGS_PATH = path.resolve("./logs");
const TEST_FILE_PATH = path.join(UPLOADS_PATH, "sample.mp3");

const services = [
  { name: "Vault", url: "http://localhost:5009/health" },
  { name: "Ingestion", url: "http://localhost:5000/hooks/upload_ready", method: "POST", body: { assetId: TEST_ASSET_ID, title: "Demo Upload" } },
  { name: "Normalization", url: "http://localhost:5008/normalize", method: "POST", body: { assetId: TEST_ASSET_ID, filePath: "/app/uploads/sample.mp3" } },
  { name: "Spotify", url: "http://localhost:5001/health" },
  { name: "SoundCloud", url: "http://localhost:5002/health" },
  { name: "Audiomack", url: "http://localhost:5004/health" },
  { name: "Apple", url: "http://localhost:5005/health" },
  { name: "Monetization", url: "http://localhost:5006/health" },
  { name: "Visual", url: "http://localhost:5007/health" },
];

const dashboardURL = "http://localhost:5010/metrics/all";
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 2000;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const logToFile = (message) => {
  fs.ensureDirSync(LOGS_PATH);
  const logFile = path.join(LOGS_PATH, "integration-test.log");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
};

const log = (message) => {
  console.log(message);
  logToFile(message);
};

const runTests = async () => {
  log("🔍 Starting full integration test...\n");

  // STEP 0: Ensure uploads and fake file exist
  log("📁 Checking uploads directory...");
  fs.ensureDirSync(UPLOADS_PATH);

  if (!fs.existsSync(TEST_FILE_PATH)) {
    log("🎵 Creating fake test audio file: sample.mp3");
    fs.writeFileSync(TEST_FILE_PATH, Buffer.alloc(1024 * 50)); // 50KB dummy file
  } else {
    log("✅ sample.mp3 already exists, skipping creation.");
  }

  const healthResults = {};

  // STEP 1: Check service health + core routes
  for (const svc of services) {
    const method = svc.method || "GET";
    const options = { method, headers: { "Content-Type": "application/json" } };
    if (svc.body) options.body = JSON.stringify(svc.body);

    try {
      const res = await fetch(svc.url, options);
      const status = res.status;
      const ok = status >= 200 && status < 300;

      healthResults[svc.name.toLowerCase()] = ok ? "success" : "error";
      log(ok
        ? `✅ ${svc.name.padEnd(16)} responded ${status}`
        : `❌ ${svc.name.padEnd(16)} failed (${status})`
      );
    } catch (err) {
      healthResults[svc.name.toLowerCase()] = "unreachable";
      log(⚠️  ${svc.name.padEnd(16)} unreachable: ${err.message}`);
    }
  }

  // STEP 2: Verify Dashboard Relay reflects status
  log("\n📊 Checking Dashboard Relay metrics consistency...");

  let dashboardMatched = false;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(dashboardURL);
      const metrics = await res.json();

      if (res.status === 200 && metrics) {
        const mismatches = [];
        for (const key of Object.keys(healthResults)) {
          if (metrics[key] && metrics[key] !== healthResults[key]) {
            mismatches.push({ service: key, expected: healthResults[key], got: metrics[key] });
          }
        }

        if (mismatches.length === 0) {
          log(`✅ Dashboard Relay metrics match all service states (after ${attempt} attempt${attempt > 1 ? "s" : ""})`);
          dashboardMatched = true;
          break;
        } else {
          log(`⚠️  Attempt ${attempt}: ${mismatches.length} mismatches found, retrying...`);
          await delay(RETRY_INTERVAL);
          continue;
        }
      } else {
        log(`❌ Dashboard Relay failed (${res.status})`);
      }
    } catch (err) {
      log(`⚠️  Attempt ${attempt}: Dashboard Relay unreachable -> ${err.message}`);
      await delay(RETRY_INTERVAL);
    }
  }

  if (!dashboardMatched) {
    log(`❌ Dashboard Relay metrics did not match after ${MAX_RETRIES} attempts.`);
  }

  // STEP 3: MongoDB verification + cleanup
  log("\n🧩 Checking MongoDB consistency...");

  let client;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const ingestionData = await db.collection("ingestion_metadata").findOne({ assetId: TEST_ASSET_ID });
    const normalizationData = await db.collection("normalized_assets").findOne({ assetId: TEST_ASSET_ID });

    if (ingestionData && normalizationData) {
      log("✅ MongoDB contains matching ingestion + normalization records for test001");
    } else {
      if (!ingestionData) log("❌ Missing ingestion metadata record in MongoDB");
      if (!normalizationData) log("❌ Missing normalization record in MongoDB");
    }

    // 🧹 Cleanup
    log("\n🧹 Cleaning up test records...");
    const delIngestion = await db.collection("ingestion_metadata").deleteOne({ assetId: TEST_ASSET_ID });
    const delNormalization = await db.collection("normalized_assets").deleteOne({ assetId: TEST_ASSET_ID });
    log(`🗑️  Deleted ${delIngestion.deletedCount} ingestion and ${delNormalization.deletedCount} normalization record(s).`);
  } catch (err) {
    log(`⚠️  MongoDB check failed: ${err.message}`);
  } finally {
    if (client) await client.close();
  }

// STEP 4: Notify Dashboard Relay about test result
try {
  const overallStatus = dashboardMatched ? "success" : "partial";
  const details = overallStatus === "success" ? "All checks passed" : "Some mismatches found";

  log("📡 Sending integration test summary to Dashboard Relay...");
  const res = await fetch("http://localhost:5010/metrics/test-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: overallStatus, details }),
  });

  if (res.ok) {
    log("✅ Dashboard Relay successfully received test status update.");
  } else {
    log(⚠️  Dashboard Relay update failed (${res.status})`);
  }
} catch (err) {
  log(`⚠️  Could not send test result to Dashboard Relay: ${err.message}`);
}

log("\n🏁 Integration test complete.\n");
};

runTests();
