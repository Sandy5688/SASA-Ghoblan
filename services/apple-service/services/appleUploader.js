// services/apple-service/services/appleUploader.js
import fs from "fs";
import { getSecret } from "../../vault-service/services/vaultClient.js";
import { appendLog } from "../../../utils/logger.js";

const DEMO_MODE = process.env.APPLE_MODE === "demo";

export const uploadToApple = async (assetId, filePath, metadata, accountId) => {
  if (DEMO_MODE) {
    await appendLog("apple.log", { platform: "apple", status: "demo_mode", assetId, accountId });
    return "demo_mode";
  }

  const clientId = await getSecret(`apple_account_${accountId}`, "CLIENT_ID");
  const clientSecret = await getSecret(`apple_account_${accountId}`, "CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    await appendLog("apple.log", { platform: "apple", status: "pending_auth", assetId, accountId });
    return "pending_auth";
  }

  try {
    await fs.promises.access(filePath);
    await appendLog("apple.log", { platform: "apple", status: "ok", assetId, accountId });
    return "ok";
  } catch (err) {
    await appendLog("apple.log", { platform: "apple", status: "error", assetId, accountId, error: err.message });
    return "error";
  }
};
