import express from "express";
import { uploadMetadata, getMetadata } from "../controllers/metadataController.js";
import { checkDemoKey } from "../utils/validator.js";

const router = express.Router();

// POST /hooks/upload_ready
router.post("/upload_ready", uploadMetadata);

// GET /metadata/:assetId
router.get("/metadata/:assetId", checkDemoKey, getMetadata);

export default router;
