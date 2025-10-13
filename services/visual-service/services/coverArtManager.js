import fs from "fs-extra";
import path from "path";
import { generateId, randomPick } from "./utils.js";

const coversDir = path.join(process.cwd(), "covers");
fs.ensureDirSync(coversDir);

// Simulated seasonal packs
const seasonalThemes = ["summer", "winter", "autumn", "spring"];

export const generateCoverArt = async (assetId) => {
  const season = randomPick(seasonalThemes);
  const filename = `${assetId}_${generateId()}.png`;
  const filepath = path.join(coversDir, filename);

  // Simulate AI cover art generation
  await fs.writeFile(filepath, `Simulated AI cover art for ${assetId} - ${season}`);

  return { filename, season, filepath };
};
