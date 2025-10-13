import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { sendAlert } from "./alert.js";
import xml2js from "xml2js";

const RSS_DIR = path.join(process.cwd(), "rss");
fs.ensureDirSync(RSS_DIR);

export const uploadToApple = async (assetId, filePath, metadata, accountId) => {
  const isDemo = process.env.APPLE_MODE === "demo";
  const rssUrl = process.env.APPLE_RSS_URL;
  const dashboardRelay = process.env.DASHBOARD_RELAY_URL;

  if (isDemo) {
    console.log("🧪 Demo mode active — simulating Apple upload");
    await axios.post(dashboardRelay, {
      service: "apple",
      assetId,
      status: "demo_upload_simulated",
      accountId,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return { platform: "apple", status: "demo_simulated" };
  }

  if (!rssUrl) {
    console.log(`⚠️ Apple RSS URL missing. Running in DEMO mode.`);
    return { platform: "apple", status: "missing_rss_url" };
  }

  try {
    // Load RSS feed
    const rssContent = await axios.get(rssUrl).then(res => res.data);
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const rssObj = await parser.parseStringPromise(rssContent);

    // Add new episode
    const newItem = {
      title: metadata.title || assetId,
      description: metadata.description || "",
      enclosure: {
        $: {
          url: filePath,
          type: "audio/mpeg"
        }
      },
      guid: assetId,
      pubDate: new Date().toUTCString()
    };

    if (!rssObj.rss.channel[0].item) rssObj.rss.channel[0].item = [];
    rssObj.rss.channel[0].item.unshift(newItem);

    // Save locally (simulated for demo/testing)
    const localRssPath = path.join(RSS_DIR, `rss_${accountId}.xml`);
    await fs.writeFile(localRssPath, builder.buildObject(rssObj));

    // Notify dashboard
    await axios.post(dashboardRelay, {
      service: "apple",
      assetId,
      status: "success",
      accountId,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    console.log(`✅ Apple upload completed for asset ${assetId}`);
    return { platform: "apple", status: "success", track_id: assetId };
  } catch (err) {
    console.error("❌ Apple upload error:", err.message);

    // Send alert
    await sendAlert(
      `Apple Upload Failed: Account ${accountId}`,
      `Asset: ${assetId}\nError: ${err.message}\nTimestamp: ${new Date().toISOString()}`
    );

    await axios.post(dashboardRelay, {
      service: "apple",
      assetId,
      status: "error",
      error: err.message,
      accountId,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return { platform: "apple", status: "error", error: err.message };
  }
};