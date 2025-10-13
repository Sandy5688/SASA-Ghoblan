// scripts/status-check.js
import { execSync } from "child_process";
import fetch from "node-fetch";

const services = [
  { name: "MongoDB", url: "http://localhost:27017" },
  { name: "Ingestion", url: "http://localhost:5000/health" },
  { name: "Spotify", url: "http://localhost:5001/health" },
  { name: "SoundCloud", url: "http://localhost:5002/health" },
  { name: "Audiomack", url: "http://localhost:5004/health" },
  { name: "Apple", url: "http://localhost:5005/health" },
  { name: "Monetization", url: "http://localhost:5006/health" },
  { name: "Visual", url: "http://localhost:5007/health" },
  { name: "Normalization", url: "http://localhost:5008/health" },
  { name: "Vault", url: "http://localhost:5009/health" },
  { name: "Dashboard Relay", url: "http://localhost:5010/health" }
];

console.log("\n🔍 Checking all service health endpoints...\n");

const checkService = async (service) => {
  try {
    const res = await fetch(service.url, { timeout: 3000 });
    if (res.ok) console.log(`✅ ${service.name.padEnd(18)} Healthy (${res.status})`);
    else console.log(`❌ ${service.name.padEnd(18)} Unhealthy (${res.status})`);
  } catch {
    console.log(`❌ ${service.name.padEnd(18)} Unreachable`);
  }
};

const run = async () => {
  await Promise.all(services.map(checkService));

  console.log("\n📦 Docker Containers:\n");

  try {
    const output = execSync('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', {
      encoding: "utf-8"
    });
    console.log(output);
  } catch (err) {
    console.log("⚠️  Could not check Docker containers:", err.message);
  }

  console.log("✅ Health check complete.\n");
};

run();
