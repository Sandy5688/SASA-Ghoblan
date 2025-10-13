/**
 * Shared automation helpers using Playwright.
 * Used by Audiomackupload automation.
 */

import fs from "fs-extra";
import path from "path";
import { chromium } from "playwright"; 

const SESSION_DIR = path.join(process.cwd(), "automation", ".sessions");
fs.ensureDirSync(SESSION_DIR);

/**
 * Launches a browser with standard settings for upload automation.
 * Headless mode is configurable by env (default: true)
 */
export async function launchBrowser({ headless = true, slowMo = 50 } = {}) {
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false" && headless,
    slowMo,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    recordVideo: { dir: path.join(SESSION_DIR, "videos") },
  });
  return { browser, context };
}

/**
 * Loads or creates a session for a specific service (Audiomack)
 */
export async function loadSession(context, service) {
  const file = path.join(SESSION_DIR, `${service}.json`);
  if (await fs.pathExists(file)) {
    const storage = await fs.readJson(file);
    await context.addCookies(storage.cookies || []);
    await context.setStorageState(storage);
  }
}

/**
 * Saves session storage for reuse next time
 */
export async function saveSession(context, service) {
  const file = path.join(SESSION_DIR, `${service}.json`);
  const state = await context.storageState();
  await fs.writeJson(file, state, { spaces: 2 });
}

/**
 * Generic wait helper for selectors
 */
export async function waitForVisible(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, state: "visible" });
    return true;
  } catch (err) {
    console.warn(`[WARN] Selector not found: ${selector}`);
    return false;
  }
}

/**
 * Click helper with auto-wait
 */
export async function clickAndWait(page, selector, waitSelector, delay = 1000) {
  await waitForVisible(page, selector);
  await page.click(selector);
  if (waitSelector) await waitForVisible(page, waitSelector);
  await page.waitForTimeout(delay);
}

/**
 * Upload file helper (input[type=file])
 */
export async function uploadFile(page, selector, filePath) {
  const input = await page.$(selector);
  if (!input) throw new Error(`Upload input ${selector} not found`);
  await input.setInputFiles(filePath);
}

/**
 * Logs into Audiomack dashboard with credentials.
 * You can extend this for other platforms.
 */
export async function performLogin(page, service, credentials) {
  if (service === "audiomack") {
    await page.goto("https://audiomack.com/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', credentials.username);
    await page.fill('input[name="password"]', credentials.password);
    await clickAndWait(page, 'button[type="submit"]', 'a[href="/dashboard"]');
  } else if (service === "apple") {
    await page.goto("https://podcastsconnect.apple.com", { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', credentials.username);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.fill('input[type="password"]', credentials.password);
    await clickAndWait(page, 'button[type="submit"]', 'main');
  } else {
    throw new Error(`Unknown service ${service}`);
  }
}

/**
 * Takes a screenshot to logs/screenshots/<service>_<timestamp>.png
 */
export async function takeScreenshot(page, service, label = "step") {
  const dir = path.join(process.cwd(), "logs", "screenshots");
  await fs.ensureDir(dir);
  const file = path.join(dir, `${service}_${label}_${Date.now()}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

/**
 * Wraps a full automation sequence with error handling and logs
 */
export async function runAutomation(service, taskFn) {
  const start = Date.now();
  const logsDir = path.join(process.cwd(), "logs");
  await fs.ensureDir(logsDir);
  const logFile = path.join(logsDir, "automation.log");

  let browser;
  try {
    const { browser: b, context } = await launchBrowser();
    browser = b;
    const page = await context.newPage();

    const result = await taskFn(page, context);

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    const log = { service, status: "ok", duration, timestamp: new Date().toISOString() };
    fs.appendFileSync(logFile, JSON.stringify(log) + "\n");

    await browser.close();
    return result;
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    const log = { service, status: "error", error: err.message, duration, timestamp: new Date().toISOString() };
    fs.appendFileSync(logFile, JSON.stringify(log) + "\n");

    if (browser) await browser.close();
    throw err;
  }
}
