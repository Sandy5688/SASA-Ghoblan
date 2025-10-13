import fs from "fs-extra";
import axios from "axios";
import path from "path";
import xmlbuilder from "xmlbuilder2";

export async function generateRSSFeed(feedPath, fileUrl, metadata) {
  try {
    const { title, description, author, category, pubDate } = metadata;
    let feed = {
      rss: {
        "@version": "2.0",
        channel: {
          title: "Your Podcast Title",
          link: "https://yourdomain.com",
          description: "Podcast feed generated automatically",
          item: [
            {
              title: title || "Untitled Episode",
              description: description || "No description provided",
              enclosure: { "@url": fileUrl, "@type": "audio/mpeg" },
              pubDate: pubDate || new Date().toUTCString(),
              author: author || "Unknown",
              category: category || "General",
            },
          ],
        },
      },
    };

    const xml = xmlbuilder.create(feed).end({ prettyPrint: true });
    await fs.outputFile(feedPath, xml);

    console.log(`📝 RSS feed updated at ${feedPath}`);
  } catch (err) {
    console.error("RSS generation error:", err.message);
    throw err;
  }
}

export async function validateAppleFeed(feedUrl) {
  try {
    const resp = await axios.get(`https://podcastsconnect.apple.com/validate?feedUrl=${encodeURIComponent(feedUrl)}`);
    if (resp.status === 200) {
      console.log("✅ Apple feed validated successfully");
      return "valid";
    } else {
      console.warn("⚠️ Apple feed validation returned non-200:", resp.status);
      return "validation_failed";
    }
  } catch (err) {
    console.error("Apple validation error:", err.message);
    return "validation_failed";
  }
}