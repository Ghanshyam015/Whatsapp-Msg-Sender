import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: Date
}, { timestamps: true });

invitationSchema.index({ workspaceId: 1, email: 1 }, { unique: true });

export default mongoose.model("Invitation", invitationSchema);
