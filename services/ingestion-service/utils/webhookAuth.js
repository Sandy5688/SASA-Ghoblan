// services/ingestion-service/utils/webhookAuth.js
import crypto from "crypto";

const DEMO_KEY = process.env.DEMO_KEY || "demo-key";

export function checkDemoKey(req, res, next) {
  const key = req.header("X-Demo-Key");
  if (!key || key !== DEMO_KEY) return res.status(401).json({ error: "Missing or invalid demo key" });
  next();
}

export function verifyHmac(req, res, next) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return next();
  const signature = req.header("X-Hub-Signature-256") || req.header("X-Signature");
  if (!signature) return res.status(401).json({ error: "Missing signature" });
  const payload = JSON.stringify(req.body || {});
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (signature.includes("=")) {
    if (!signature.endsWith(hmac)) return res.status(401).json({ error: "Invalid signature" });
  } else {
    if (signature !== hmac) return res.status(401).json({ error: "Invalid signature" });
  }
  next();
}