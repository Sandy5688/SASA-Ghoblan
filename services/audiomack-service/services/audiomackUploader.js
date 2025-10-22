// services/audiomack-service/services/audiomackUploader.js
import { chromium } from "playwright";
import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { sendAlert } from "./alert.js"; // keep existing alert.js
import { getSecret } from "../../vault-service/services/vaultClient.js";
import { appendLog } from "../../../utils/logger.js";

const SESSIONS_DIR = path.join(process.cwd(), "sessions");
await fs.ensureDir(SESSIONS_DIR);

export const uploadToAudiomack = async (assetId, filePath, metadata, accountId) => {
  let platformsConfig = { audiomack: { enabled: true } };
  try { platformsConfig = await fs.readJson(path.join(process.cwd(), "../config/platforms.json")); } catch {}

  if (!platformsConfig.audiomack?.enabled) {
    await appendLog("audiomack.log", { platform: "audiomack", status: "disabled_in_config", assetId, accountId });
    return "disabled_in_config";
  }

  const mode = (process.env.AUDIOMACK_MODE || "demo").toLowerCase();
  if (mode === "demo") {
    await appendLog("audiomack.log", { platform: "audiomack", status: "demo_simulated", assetId, accountId });
    return { platform: "audiomack", status: "demo_simulated", track_id: assetId };
  }

  const email = await getSecret(`audiomack_account_${accountId}`, "EMAIL");
  const password = await getSecret(`audiomack_account_${accountId}`, "PASSWORD");

  if (!email || !password) {
    await appendLog("audiomack.log", { platform: "audiomack", status: "missing_credentials", assetId, accountId });
    return { platform: "audiomack", status: "missing_credentials", track_id: assetId };
  }

  if (!(await fs.pathExists(filePath))) {
    await appendLog("audiomack.log", { platform: "audiomack", status: "file_not_found", assetId, accountId });
    return { platform: "audiomack", status: "file_not_found", track_id: assetId };
  }

  const sessionFile = path.join(SESSIONS_DIR, `session_${accountId}_${assetId}.json`);
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = fs.existsSync(sessionFile) ? await browser.newContext({ storageState: await fs.readJson(sessionFile) }) : await browser.newContext();
    const page = await context.newPage();

    if (!fs.existsSync(sessionFile)) {
      await page.goto("https://www.audiomack.com/login", { waitUntil: "domcontentloaded" });
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForSelector('a[href="/upload"], .profile', { timeout: 15000 });
      await context.storageState({ path: sessionFile });
    }

    await page.goto("https://www.audiomack.com/upload", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    await page.setInputFiles('input[type="file"]', filePath);

    if (metadata.title) await page.fill('input[name="title"]', metadata.title);
    if (metadata.description) await page.fill('textarea[name="description"]', metadata.description);
    if (metadata.tags && Array.isArray(metadata.tags)) await page.fill('input[name="tags"]', metadata.tags.join(", "));
    if (metadata.genre) { try { await page.selectOption('select[name="genre"]', metadata.genre); } catch {}

    await page.click('button[type="submit"]');
    await page.waitForSelector('.upload-success, .upload-complete, text=Upload Complete', { timeout: 20000 }).catch(() => {});
    await context.storageState({ path: sessionFile });
    await appendLog("audiomack.log", { platform: "audiomack", status: "success", assetId, accountId });
    return { platform: "audiomack", status: "success", track_id: assetId };
  } catch (err) {
    await appendLog("audiomack.log", { platform: "audiomack", status: "error", assetId, accountId, error: err.message });
    try { await sendAlert(`Audiomack Upload Failed: ${assetId}`, `Account ${accountId} error: ${err.message}`); } catch {}
    return { platform: "audiomack", status: "error", error: err.message };
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
};
