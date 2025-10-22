// utils/logger.js
import fs from "fs-extra";
import path from "path";

const LOGS_DIR = process.env.LOGS_DIR || path.join(process.cwd(), "logs");
await fs.ensureDir(LOGS_DIR);

export async function appendLog(filename, obj) {
  const p = path.join(LOGS_DIR, filename);
  const line = JSON.stringify({ ...obj, timestamp: new Date().toISOString() }) + "\n";
  try {
    await fs.appendFile(p, line);
  } catch (err) {
    console.error(`appendLog error (${filename}):`, err?.message || err);
  }
}