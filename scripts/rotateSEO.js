import fs from "fs-extra";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "logs", "cron.log");

const SEO_KEYWORDS = [
  "summer vibes",
  "2025 trending mix",
  "focus beats",
  "late night session",
  "new wave playlist"
];

const DESCRIPTIONS = [
  "Enjoy the freshest tunes of the season.",
  "A blend of rhythm, focus, and flow.",
  "Curated for your daily motivation.",
  "Unwind with trending audio vibes."
];

async function rotateSEO() {
  const index = Math.floor(Math.random() * SEO_KEYWORDS.length);
  const keyword = SEO_KEYWORDS[index];
  const description = DESCRIPTIONS[index % DESCRIPTIONS.length];

  const log = {
    task: "rotateSEO",
    keyword,
    description,
    timestamp: new Date().toISOString()
  };

  fs.appendFileSync(LOG_FILE, JSON.stringify(log) + "\n");
  console.log(`[SEO] Updated keyword: ${keyword}`);
}

rotateSEO().catch(err => {
  console.error(err);
  fs.appendFileSync(LOG_FILE, JSON.stringify({ task: "rotateSEO", error: err.message }) + "\n");
});
