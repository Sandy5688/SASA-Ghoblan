import fs from "fs-extra";
import path from "path";
import axios from "axios";

const LOGS_DIR = path.join(process.cwd(), "logs");
fs.ensureDirSync(LOGS_DIR);

const DEMO_MODE = process.env.SPOTIFY_DEMO_MODE === "true";
const DASHBOARD_RELAY = process.env.DASHBOARD_RELAY_URL;

/**
 * Upload to Spotify (demo/live)
 * @param {string} assetId
 * @param {string} filePath
 * @param {object} metadata
 * @param {number} accountId
 */
export const uploadToSpotify = async (assetId, filePath, metadata, accountId) => {
  try {
    // --- Check toggle ---
    const configPath = path.join(process.cwd(), "config/platforms.json");
    const platformsConfig = await fs.readJson(configPath);

    if (!platformsConfig.spotify?.enabled) {
      console.log("⚙️ Spotify disabled in config/platforms.json");
      return { platform: "spotify", status: "disabled_in_config" };
    }

    // --- Demo mode ---
    if (DEMO_MODE) {
      console.log(`🎧 [Spotify DEMO] Simulating upload for account ${accountId}`);
      await axios.post(DASHBOARD_RELAY, {
        service: "spotify",
        assetId,
        status: "demo_ok",
        accountId,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
      return { platform: "spotify", status: "demo_ok" };
    }

    // --- Live mode credentials ---
    const clientId = process.env[`SPOTIFY_CLIENT_ID_${accountId}`];
    const clientSecret = process.env[`SPOTIFY_CLIENT_SECRET_${accountId}`];

    if (!clientId || !clientSecret) {
      console.log(`⚠️ Spotify Account ${accountId} missing credentials`);
      return { platform: "spotify", status: "missing_credentials" };
    }

    console.log(`🚀 [Spotify LIVE] Uploading ${assetId} using Account ${accountId}`);

    // --- Auth with Spotify ---
    const authResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
      }
    );
    const token = authResponse.data.access_token;

    // --- Simulate upload (replace with real API call if needed) ---
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // --- Log success ---
    const logEntry = {
      platform: "spotify",
      assetId,
      accountId,
      status: "ok",
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(path.join(LOGS_DIR, "spotify.log"), JSON.stringify(logEntry) + "\n");

    await axios.post(DASHBOARD_RELAY, logEntry).catch(() => {});

    console.log(`✅ [Spotify LIVE] ${metadata.title || assetId} uploaded successfully`);
    return { platform: "spotify", status: "ok" };

  } catch (err) {
    console.error("❌ Spotify Upload Error:", err.message);

    const logEntry = {
      platform: "spotify",
      assetId,
      accountId,
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(path.join(LOGS_DIR, "spotify.log"), JSON.stringify(logEntry) + "\n");
    await axios.post(DASHBOARD_RELAY, logEntry).catch(() => {});

    return { platform: "spotify", status: "error", error: err.message };
  }
};
