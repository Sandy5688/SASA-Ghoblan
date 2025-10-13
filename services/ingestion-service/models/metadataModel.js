import mongoose from "mongoose";

const MetadataSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true },
  metadata: {
    title: { type: Object, default: {} },       // { en: "...", es: "...", hi: "..." }
    description: { type: Object, default: {} },
    tags: { type: Object, default: {} },
    transcript: { type: Object, default: {} }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Metadata", MetadataSchema);
