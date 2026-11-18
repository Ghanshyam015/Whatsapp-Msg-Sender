import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, trim: true, default: "" },
  passwordHash: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation" },
  role: { type: String, enum: ["owner", "admin", "member"], default: "owner" },
  authVersion: { type: Number, default: 0 },
  emailVerified: { type: Boolean, default: false },
  verificationCodeHash: String,
  verificationExpiresAt: Date,
  resetCodeHash: String,
  resetExpiresAt: Date
}, { timestamps: true });

export default mongoose.model("User", userSchema);
