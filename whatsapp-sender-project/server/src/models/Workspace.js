import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan: { type: String, enum: ["starter", "growth", "business"], default: "starter" },
  billingStatus: { type: String, enum: ["trial", "active", "past_due", "cancelled"], default: "trial" },
  billingPaymentId: String,
  subscriptionExpiresAt: Date,
  timezone: { type: String, default: "UTC" },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  groups: [{ name: { type: String, required: true, trim: true }, color: { type: String, default: "#1769c2" } }],
  automations: [{ name: { type: String, required: true, trim: true }, enabled: { type: Boolean, default: false }, trigger: String, templateName: String }]
}, { timestamps: true });

export default mongoose.model("Workspace", workspaceSchema);
