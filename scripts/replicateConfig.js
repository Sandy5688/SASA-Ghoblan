import fs from "fs-extra";
import path from "path";

const src = path.join(process.cwd(), "config");
const LOG_FILE = path.join(process.cwd(), "logs", "cron.log");

async function replicateConfig(laneName) {
  const target = path.join(process.cwd(), "lanes", laneName, "config");
  await fs.ensureDir(target);
  await fs.copy(src, target);

  const log = {
    task: "replicateConfig",
    lane: laneName,
    timestamp: new Date().toISOString()
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(log) + "\n");

  console.log(`[Config Replication] Created lane config at ${target}`);
}

const lane = process.argv[2] || "demo_lane";
replicateConfig(lane).catch(err => {
  console.error(err);
  fs.appendFileSync(LOG_FILE, JSON.stringify({ task: "replicateConfig", error: err.message }) + "\n");
});
