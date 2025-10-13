import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";

const UPLOADS_DIR = "/app/uploads";
const LOGS_DIR = "/app/logs";

// Ensure uploads folder exists
fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(LOGS_DIR);

// Create a dummy test file if not exists
const TEST_FILE = path.join(UPLOADS_DIR, "sample.mp3");
if (!fs.existsSync(TEST_FILE)) {
  fs.writeFileSync(TEST_FILE, Buffer.alloc(1024 * 50)); // 50KB dummy file
  console.log("🎵 Created dummy sample.mp3 for upload tests");
}

// Platforms to test
const platforms = [
  { name: "Spotify", url: "http://spotify:5001/upload", accountId: 1 },
  { name: "SoundCloud", url: "http://soundcloud:5002/upload", accountId: 1 },
  { name: "Audiomack", url: "http://audiomack:5004/upload", accountId: 1 },
  { name: "Apple", url: "http://apple:5005/upload", accountId: 1 },
];

const runTests = async () => {
  console.log("🎧 Running Platform Upload Tests...\n");

  const results = [];

  for (const platform of platforms) {
    try {
      const res = await fetch(platform.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: "test001",
          filePath: TEST_FILE,
          metadata: { title: "Demo Upload" },
          accountId: platform.accountId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✅ ${platform.name} upload simulated successfully:`, data.status);
        results.push({ platform: platform.name, status: "ok" });
      } else {
        console.log(`❌ ${platform.name} upload failed: HTTP ${res.status}`, data);
        results.push({ platform: platform.name, status: "error", http: res.status });
      }
    } catch (err) {
      console.log(`❌ ${platform.name} upload failed:`, err.message);
      results.push({ platform: platform.name, status: "error", error: err.message });
    }
  }

  // Save summary to logs
  const summaryPath = path.join(LOGS_DIR, "platform-test-summary.json");
  await fs.writeJson(summaryPath, { results, timestamp: new Date().toISOString() }, { spaces: 2 });
  console.log(`\n📦 Test Summary saved to ${summaryPath}\n`);
};

runTests();