import fs from "fs-extra";
import path from "path";

const configFile = path.join(process.cwd(), "config", "affiliates.json");
const LOG_FILE = path.join(process.cwd(), "logs", "cron.log");

async function rotateAffiliates() {
  const config = await fs.readJson(configFile);
  for (const pack of config.affiliatePacks) {
    const { links, rotation } = pack;
    if (!rotation) continue;
    const nextIndex = Math.floor(Math.random() * links.length);
    const next = links[nextIndex];

    pack.activeLink = next.url;
    pack.lastRotated = new Date().toISOString();

    fs.appendFileSync(LOG_FILE, JSON.stringify({
      task: "rotateAffiliates",
      pack: pack.id,
      activeLink: next.url,
      timestamp: pack.lastRotated
    }) + "\n");
  }

  await fs.writeJson(configFile, config, { spaces: 2 });
}

rotateAffiliates().catch(err => {
  console.error(err);
  fs.appendFileSync(LOG_FILE, JSON.stringify({ task: "rotateAffiliates", error: err.message }) + "\n");
});
