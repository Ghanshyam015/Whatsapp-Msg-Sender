import mongoose from "mongoose";
const contactSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  name: { type: String, trim: true, default: "" },
  phone: { type: String, required: true, unique: true, index: true },
  optedIn: { type: Boolean, default: false, index: true },
  consentSource: { type: String, default: "" },
  tags: { type: [String], default: [] },
  groupIds: [{ type: mongoose.Schema.Types.ObjectId }],
  consentedAt: { type: Date, default: null },
  optedOutAt: { type: Date, default: null }
}, { timestamps: true });
export default mongoose.model("Contact", contactSchema);
