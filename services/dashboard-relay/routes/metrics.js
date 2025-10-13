import fs from "fs-extra";
import path from "path";

const testSummaryPath = path.join(process.cwd(), "logs", "test-summary.json");
if (fs.existsSync(testSummaryPath)) {
  const testSummary = fs.readJsonSync(testSummaryPath);
  metrics.test_status = testSummary.status;
  metrics.test_timestamp = testSummary.timestamp;
}
