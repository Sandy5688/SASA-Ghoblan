import express from "express";
import fs from "fs-extra";
import path from "path";

const router = express.Router();
const testLogFile = path.join(process.cwd(), "logs", "integration-test.log");

router.post("/test-update", async (req, res) => {
  try {
    const { status, details } = req.body;
    const timestamp = new Date().toISOString();

    const summaryPath = path.join(process.cwd(), "logs", "test-summary.json");
    await fs.ensureDir(path.dirname(summaryPath));
    await fs.writeJson(summaryPath, { status, details, timestamp }, { spaces: 2 });

    // Append to integration log
    await fs.ensureFile(testLogFile);
    await fs.appendFile(testLogFile, `[${timestamp}] TEST UPDATE: ${status} - ${details}\n`);

    res.status(200).json({ message: "Test status updated", timestamp });
  } catch (err) {
    console.error("Error saving test status:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
