// ✅ Works in Node 18+ (no need for node-fetch)
const services = [
  { name: "ingestion", url: "http://ingestion_service:5000/health" },
  { name: "normalization", url: "http://normalization_service:5008/health" },
  { name: "dashboard", url: "http://dashboard_relay:5010/health" },
];

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testService(name, url, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.text();

      if (res.ok) {
        console.log(`✅ ${name} (attempt ${attempt}) responded:`, data.slice(0, 60));
        return { name, status: res.status, ok: true };
      } else {
        console.warn(`⚠️ ${name} returned ${res.status}, retrying...`);
      }
    } catch (err) {
      console.warn(`❌ ${name} failed on attempt ${attempt}: ${err.message}`);
    }

    if (attempt < retries) {
      console.log(`🔄 Retrying ${name} in ${delay / 1000}s...\n`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  console.error(`❌ ${name} failed after ${retries} attempts.`);
  return { name, ok: false };
}

(async () => {
  console.log("🚀 Running integration tests with retries...\n");

  const results = [];
  for (const s of services) {
    const r = await testService(s.name, s.url);
    results.push(r);
  }

  console.log("\n🧾 Summary:");
  results.forEach(r => {
    console.log(`${r.ok ? "✅" : "❌"} ${r.name} - ${r.ok ? "OK" : "FAILED"}`);
  });

  const allOk = results.every(r => r.ok);
  console.log(`\n${allOk ? "🎉 All services healthy!" : "⚠️ Some services failed health checks."}`);
  process.exit(allOk ? 0 : 1);
})();
