import mongoose from "mongoose";
const campaignSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  name: { type: String, required: true },
  templateName: { type: String, required: true },
  languageCode: { type: String, default: "en_US" },
  status: { type: String, enum: ["scheduled", "queued", "processing", "completed", "failed"], default: "queued" },
  total: { type: Number, default: 0 },
  accepted: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  read: { type: Number, default: 0 },
  scheduledAt: Date,
  createdBy: String
}, { timestamps: true });
export default mongoose.model("Campaign", campaignSchema);
