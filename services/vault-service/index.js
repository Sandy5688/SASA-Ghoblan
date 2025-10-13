import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { getSecret, setSecret, isVaultHealthy } from "./services/vaultClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const logsDir = path.join(process.cwd(), "logs");
fs.ensureDirSync(logsDir);

function logEvent(event) {
  const logPath = path.join(logsDir, "vault.log");
  fs.appendFileSync(logPath, JSON.stringify(event) + "\n");
}

// Basic health check
app.get("/health", async (req, res) => {
  try {
    const vaultHealth = await isVaultHealthy();
    res.json({ ok: true, vault: vaultHealth });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /secret/:service/:key
 * Example: GET /secret/spotify/client_secret
 */
app.get("/secret/:service/:key", async (req, res) => {
  const { service, key } = req.params;
  try {
    const value = await getSecret(service, key);
    const status = value ? "found" : "not_found";
    const log = {
      node: "vault",
      action: "getSecret",
      service,
      key,
      status,
      timestamp: new Date().toISOString(),
    };
    logEvent(log);

    if (!value) return res.status(404).json({ found: false });
    res.json({ found: true, value });
  } catch (err) {
    const log = {
      node: "vault",
      action: "getSecret",
      service,
      key,
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString(),
    };
    logEvent(log);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /secret
 * Body: { service: "spotify", key: "client_secret", value: "..." }
 * Allowed in Vault mode. In local fallback it will write to ./credentials.
 */
app.post("/secret", async (req, res) => {
  const { service, key, value } = req.body;
  if (!service || !key || typeof value === "undefined") {
    return res.status(400).json({ error: "service, key and value are required" });
  }

  // If vault enabled, require VAULT_ADMIN_TOKEN
  if (
    (process.env.VAULT_ENABLED === "true" || process.env.VAULT_ENABLED === "1") &&
    process.env.VAULT_ADMIN_TOKEN
  ) {
    const provided = req.header("X-Vault-Admin-Token");
    if (!provided || provided !== process.env.VAULT_ADMIN_TOKEN) {
      const log = {
        node: "vault",
        action: "setSecret",
        service,
        key,
        status: "forbidden",
        timestamp: new Date().toISOString(),
      };
      logEvent(log);
      return res.status(403).json({ error: "forbidden" });
    }
  }

  try {
    await setSecret(service, key, value);
    const log = {
      node: "vault",
      action: "setSecret",
      service,
      key,
      status: "ok",
      timestamp: new Date().toISOString(),
    };
    logEvent(log);
    res.json({ success: true });
  } catch (err) {
    const log = {
      node: "vault",
      action: "setSecret",
      service,
      key,
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString(),
    };
    logEvent(log);
    res.status(500).json({ error: err.message });
  }
});

// List secrets for a service (local only)
app.get("/secrets/:service", async (req, res) => {
  const { service } = req.params;
  try {
    const credsDir =
      process.env.CREDENTIALS_DIR || path.join(process.cwd(), "..", "..", "credentials");
    const filePath = path.join(credsDir, `${service}.json`);

    if (await fs.pathExists(filePath)) {
      const obj = await fs.readJson(filePath);
      return res.json({ found: true, secrets: Object.keys(obj) });
    }

    return res.status(404).json({ found: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Vault credential service running ✅");
});

const PORT = process.env.VAULT_PORT || process.env.BACKEND_PORT || 5009;
app.listen(PORT, () => {
  console.log(`🔐 Vault service running on port ${PORT} (VAULT_ENABLED=${process.env.VAULT_ENABLED})`);
});
