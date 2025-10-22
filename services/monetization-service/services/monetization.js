import fs from "fs-extra";
import path from "path";
import { processAffiliate } from "./affiliateManager.js";
import { processSponsorship } from "./sponsorshipManager.js";

// Load affiliates config
const AFFILIATES_FILE = path.join(process.cwd(), "../config/affiliates.json");
const affiliatesConfig = fs.readJsonSync(AFFILIATES_FILE);

export const handleMonetization = async (asset) => {
  try {
    // Example: Affiliate revenue calculation
    if (affiliatesConfig.affiliateEnabled) {
      await processAffiliate(asset, affiliatesConfig.affiliateSettings);
    }

    // Example: Sponsorship hooks
    if (affiliatesConfig.sponsorshipEnabled) {
      await processSponsorship(asset, affiliatesConfig.sponsorshipSettings);
    }

    return { status: "success", assetId: asset.id };
  } catch (err) {
    console.error("❌ Monetization hook error:", err.message);
    return { status: "error", assetId: asset.id, error: err.message };
  }
};
