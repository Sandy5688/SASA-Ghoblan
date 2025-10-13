import fs from "fs-extra";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
const MAX_AGE_DAYS = 14;

async function cleanupLogs() {
  const files = await fs.readdir(logsDir);
  const now = Date.now();

  for (const file of files) {
    const fullPath = path.join(logsDir, file);
    const stats = await fs.stat(fullPath);
    if (stats.isFile() && (now - stats.mtimeMs) > MAX_AGE_DAYS * 86400000) {
      await fs.remove(fullPath);
      console.log(`[Cleanup] Deleted old log file: ${file}`);
    }
  }

  fs.appendFileSync(path.join(logsDir, "cron.log"),
    JSON.stringify({ task: "cleanupLogs", status: "done", timestamp: new Date().toISOString() }) + "\n");
}

cleanupLogs().catch(console.error);
