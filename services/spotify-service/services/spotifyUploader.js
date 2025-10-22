import fs from "fs";
import { getSecret } from "../../vault-service/services/vaultClient.js";
import { appendLog } from "../../../utils/logger.js";

const DEMO_MODE = process.env.SPOTIFY_MODE === "demo";

export const uploadToSpotify = async (assetId, filePath, metadata, accountId) => {
  if (DEMO_MODE) {
    await appendLog("spotify.log", { platform: "spotify", status: "demo_mode", assetId, accountId });
    return "demo_mode";
  }

  const clientId = await getSecret(`spotify_account_${accountId}`, "CLIENT_ID");
  const clientSecret = await getSecret(`spotify_account_${accountId}`, "CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    await appendLog("spotify.log", { platform: "spotify", status: "pending_auth", assetId, accountId });
    return "pending_auth";
  }

  try {
    await fs.promises.access(filePath);
    await appendLog("spotify.log", { platform: "spotify", status: "ok", assetId, accountId });
    return "ok";
  } catch (err) {
    await appendLog("spotify.log", { platform: "spotify", status: "error", assetId, accountId, error: err.message });
    return "error";
  }
};
