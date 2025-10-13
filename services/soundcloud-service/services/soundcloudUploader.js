import fs from "fs";
import axios from "axios";
import path from "path";

const DEMO_MODE = process.env.SOUNDCLOUD_DEMO_MODE === "true";

/**
 * Upload to SoundCloud (demo + live mode)
 * @param {string} assetId
 * @param {string} filePath
 * @param {object} metadata
 * @param {number} accountId
 */
export const uploadToSoundCloud = async (assetId, filePath, metadata, accountId) => {
  try {
    const configPath = path.join(process.cwd(), "../config/platforms.json");
    const platformsConfig = JSON.parse(fs.readFileSync(configPath));

    // Check toggle in config
    if (!platformsConfig.soundcloud.enabled) {
      console.log("⚙️ SoundCloud disabled in config/platforms.json");
      return "disabled_in_config";
    }

    if (DEMO_MODE) {
      console.log(`🎧 [SoundCloud DEMO] Simulating upload for account ${accountId}`);
      await new Promise((res) => setTimeout(res, 800));
      return "demo_ok";
    }

    const clientId = process.env[`SOUNDCLOUD_CLIENT_ID_${accountId}`];
    const clientSecret = process.env[`SOUNDCLOUD_CLIENT_SECRET_${accountId}`];
    const token = process.env[`SOUNDCLOUD_ACCESS_TOKEN_${accountId}`];

    if (!clientId || !clientSecret || !token) {
      console.log(`⚠️ SoundCloud Account ${accountId} missing credentials — skipping.`);
      return "missing_credentials";
    }

    console.log(`🚀 [SoundCloud LIVE] Uploading ${assetId} using Account ${accountId}`);

    // Step 1: Upload audio file
    const uploadUrl = "https://api.soundcloud.com/tracks";

    const formData = new FormData();
    formData.append("track[title]", metadata.title || assetId);
    formData.append("track[description]", metadata.description || "Uploaded via pipeline");
    formData.append("track[sharing]", "public");
    formData.append("track[asset_data]", fs.createReadStream(filePath));

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: {
        Authorization: `OAuth ${token}`,
        ...formData.getHeaders(),
      },
    });

    console.log(`✅ [SoundCloud LIVE] Track uploaded: ${uploadResponse.data.permalink_url}`);
    return "ok";
  } catch (err) {
    console.error("❌ SoundCloud Upload Error:", err.message);
    return "error";
  }
};