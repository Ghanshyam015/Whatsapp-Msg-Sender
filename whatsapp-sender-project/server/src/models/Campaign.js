import mongoose from "mongoose";
const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  templateName: { type: String, required: true },
  languageCode: { type: String, default: "en_US" },
  status: { type: String, enum: ["queued", "processing", "completed", "failed"], default: "queued" },
  total: { type: Number, default: 0 },
  accepted: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  createdBy: String
}, { timestamps: true });
export default mongoose.model("Campaign", campaignSchema);
