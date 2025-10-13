import fs from "fs-extra";
import path from "path";
import { randomPick } from "./utils.js";

const overlaysDir = path.join(process.cwd(), "overlays");
fs.ensureDirSync(overlaysDir);

const sponsorTemplates = [
  "Sponsor Overlay US",
  "Sponsor Overlay EU",
  "Sponsor Overlay APAC"
];

export const generateOverlay = async (assetId) => {
  const overlay = randomPick(sponsorTemplates);
  const filename = `${assetId}_overlay.png`;
  const filepath = path.join(overlaysDir, filename);

  await fs.writeFile(filepath, `Simulated overlay: ${overlay}`);
  return { filename, overlay, filepath };
};
