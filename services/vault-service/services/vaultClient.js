import fs from "fs-extra";
import path from "path";
import vaultFactory from "node-vault";
import dotenv from "dotenv";
dotenv.config();

const CREDENTIALS_DIR = process.env.CREDENTIALS_DIR || path.join(process.cwd(), "..", "..", "credentials");

/**
 * Vault client wrapper. If VAULT_ENABLED is true, it will attempt to use node-vault.
 * Otherwise, it will read/write secrets to the local credentials directory as JSON files:
 *  ./credentials/<service>.json  -> { KEY: "value", ... }
 */

const useVault = (process.env.VAULT_ENABLED === "true" || process.env.VAULT_ENABLED === "1");

let vault = null;
if (useVault) {
  // create node-vault client
  vault = vaultFactory({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ADDR || "http://127.0.0.1:8200",
    token: process.env.VAULT_TOKEN || ""
  });
}

/**
 * Read secret
 * @param {string} service
 * @param {string} key
 */
export async function getSecret(service, key) {
  if (useVault && vault) {
    try {
      // Assumes KV v2 at secret/data/<service>/<key> or secret/data/<service>
      // We'll attempt to read secret at secret/data/<service>
      const secretPath = `secret/data/${service}`;
      const resp = await vault.read(secretPath);
      if (resp && resp.data && resp.data.data && Object.prototype.hasOwnProperty.call(resp.data.data, key)) {
        return resp.data.data[key];
      }
      return null;
    } catch (err) {
      // return null so callers can decide fallback
      throw new Error(`Vault read error: ${err.message}`);
    }
  } else {
    // Local file fallback
    try {
      const filePath = path.join(CREDENTIALS_DIR, `${service}.json`);
      if (!fs.existsSync(filePath)) return null;
      const content = await fs.readJson(filePath);
      return content[key] || null;
    } catch (err) {
      throw new Error(`Local credential read error: ${err.message}`);
    }
  }
}

/**
 * Write secret (only allowed when VAULT_ENABLED=true or when local writes allowed)
 * @param {string} service
 * @param {string} key
 * @param {string} value
 */
export async function setSecret(service, key, value) {
  if (useVault && vault) {
    try {
      // Write to secret/data/<service> with KV v2 format
      const secretPath = `secret/data/${service}`;
      // read current to merge
      let current = {};
      try {
        const existing = await vault.read(secretPath);
        current = (existing && existing.data && existing.data.data) ? existing.data.data : {};
      } catch (e) {
        current = {};
      }
      current[key] = value;
      // write
      await vault.write(secretPath, { data: current });
      return true;
    } catch (err) {
      throw new Error(`Vault write error: ${err.message}`);
    }
  } else {
    // Local write fallback
    try {
      await fs.ensureDir(CREDENTIALS_DIR);
      const filePath = path.join(CREDENTIALS_DIR, `${service}.json`);
      let current = {};
      if (await fs.pathExists(filePath)) {
        current = await fs.readJson(filePath);
      }
      current[key] = value;
      await fs.writeJson(filePath, current, { spaces: 2 });
      return true;
    } catch (err) {
      throw new Error(`Local credential write error: ${err.message}`);
    }
  }
}

/**
 * Check if vault is reachable (if used)
 */
export async function isVaultHealthy() {
  if (!useVault || !vault) return { enabled: false };
  try {
    const sys = await vault.health();
    return { enabled: true, initialized: sys.initialized, sealed: sys.sealed };
  } catch (err) {
    return { enabled: true, error: err.message };
  }
}
