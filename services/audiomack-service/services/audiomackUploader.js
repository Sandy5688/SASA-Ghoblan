import { chromium } from "playwright";
import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { sendAlert } from "./alert.js";

const SESSIONS_DIR = path.join(process.cwd(), "sessions");
fs.ensureDirSync(SESSIONS_DIR);

export const uploadToAudiomack = async (assetId, filePath, metadata, accountId) => {
  const isDemo = process.env.AUDIOMACK_MODE === "demo";
  const email = process.env[`AUDIOMACK_EMAIL_${accountId}`];
  const password = process.env[`AUDIOMACK_PASSWORD_${accountId}`]; // <- fixed
  const dashboardRelay = process.env.DASHBOARD_RELAY_URL;

  // ---------- DEMO MODE ----------
  if (isDemo) {
    console.log(`🧪 Demo mode active — simulating Audiomack upload for asset: ${metadata.title || assetId}`);

    await axios.post(dashboardRelay, {  
      service: "audiomack",  
      assetId,  
      status: "demo_upload_simulated",  
      accountId,  
      timestamp: new Date().toISOString(),  
    }).catch(() => {});  

    return { platform: "audiomack", status: "demo_simulated", track_id: assetId };
  }

  // ---------- MISSING CREDENTIALS ----------
  if (!email || !password) {
    console.log(`⚠️ Missing Audiomack credentials for Account ${accountId}. Upload skipped.`);
    return { platform: "audiomack", status: "missing_credentials", track_id: assetId };
  }

  const sessionFile = path.join(SESSIONS_DIR, `session_${accountId}.json`);
  let context;

  try {
    const browser = await chromium.launch({ headless: true });

    if (fs.existsSync(sessionFile)) {
      const storageState = await fs.readJson(sessionFile);
      context = await browser.newContext({ storageState });
    } else {
      context = await browser.newContext();
    }

    const page = await context.newPage();

    // ---------- LOGIN IF NO SESSION ----------
    if (!fs.existsSync(sessionFile)) {
      await page.goto("https://www.audiomack.com/login");
      await page.fill("input[name=email]", email);
      await page.fill("input[name=password]", password);
      await page.click("button[type=submit]");
      await page.waitForTimeout(3000); // allow login
      await context.storageState({ path: sessionFile });
    }

    // ---------- UPLOAD ----------
    await page.goto("https://www.audiomack.com/upload");
    await page.setInputFiles('input[type="file"]', filePath);

    await page.fill('input[name="title"]', metadata.title || assetId);
    await page.fill('textarea[name="description"]', metadata.description || "");
    if (metadata.genre) await page.selectOption('select[name="genre"]', metadata.genre);
    if (metadata.tags) await page.fill('input[name="tags"]', metadata.tags.join(", "));

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // allow processing

    await context.storageState({ path: sessionFile }); // refresh session
    await browser.close();

    // ---------- LOG SUCCESS TO DASHBOARD ----------
    await axios.post(dashboardRelay, {  
      service: "audiomack",  
      assetId,  
      status: "success",  
      accountId,  
      timestamp: new Date().toISOString(),  
    }).catch(() => {});  

    console.log(`✅ Audiomack upload completed for asset: ${metadata.title || assetId}`);
    return { platform: "audiomack", status: "success", track_id: assetId };

  } catch (err) {
    console.error("❌ Audiomack upload error:", err.message);

    // ---------- SEND ALERT ----------
    await sendAlert(
      `Audiomack Upload Failed: Account ${accountId}`,
      `Asset: ${metadata.title || assetId}\nError: ${err.message}\nTimestamp: ${new Date().toISOString()}`
    );

    // ---------- LOG ERROR TO DASHBOARD ----------
    await axios.post(dashboardRelay, {  
      service: "audiomack",  
      assetId,  
      status: "error",  
      error: err.message,  
      accountId,  
      timestamp: new Date().toISOString(),  
    }).catch(() => {});  

    return { platform: "audiomack", status: "error", error: err.message, track_id: assetId };
  }
};
