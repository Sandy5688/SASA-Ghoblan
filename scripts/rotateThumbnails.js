import fs from "fs-extra";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads", "thumbnails");
const LOG_FILE = path.join(process.cwd(), "logs", "cron.log");

async function rotateThumbnails() {
  const files = await fs.readdir(uploadsDir);
  const groups = {};

  // Group by asset prefix (e.g. "mix001_v1.png", "mix001_v2.png")
  files.forEach(file => {
    const base = file.split("_v")[0];
    if (!groups[base]) groups[base] = [];
    groups[base].push(file);
  });

  for (const [asset, variants] of Object.entries(groups)) {
    if (variants.length > 1) {
      const choice = variants[Math.floor(Math.random() * variants.length)];
      const selected = path.join(uploadsDir, choice);
      const link = path.join(uploadsDir, `${asset}_current.png`);
      await fs.copy(selected, link);
      fs.appendFileSync(LOG_FILE, JSON.stringify({ task: "rotateThumbnails", asset, selected, timestamp: new Date().toISOString() }) + "\n");
    }
  }
}

rotateThumbnails().catch(err => {
  console.error(err);
  fs.appendFileSync(LOG_FILE, JSON.stringify({ task: "rotateThumbnails", error: err.message }) + "\n");
});
