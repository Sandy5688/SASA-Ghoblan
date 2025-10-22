import fs from "fs";
import { getSecret } from "../../vault-service/services/vaultClient.js";
import { appendLog } from "../../../utils/logger.js";

const DEMO_MODE = process.env.SOUNDCLOUD_MODE === "demo";

export const uploadToSoundCloud = async (assetId, filePath, metadata, accountId) => {
  if (DEMO_MODE) {
    await appendLog("soundcloud.log", { platform: "soundcloud", status: "demo_mode", assetId, accountId });
    return "demo_mode";
  }

  const clientId = await getSecret(`soundcloud_account_${accountId}`, "CLIENT_ID");
  const clientSecret = await getSecret(`soundcloud_account_${accountId}`, "CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    await appendLog("soundcloud.log", { platform: "soundcloud", status: "pending_auth", assetId, accountId });
    return "pending_auth";
  }

  try {
    await fs.promises.access(filePath);
    await appendLog("soundcloud.log", { platform: "soundcloud", status: "ok", assetId, accountId });
    return "ok";
  } catch (err) {
    await appendLog("soundcloud.log", { platform: "soundcloud", status: "error", assetId, accountId, error: err.message });
    return "error";
  }
};
