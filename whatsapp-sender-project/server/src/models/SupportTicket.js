import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", index: true },
  name: { type: String, trim: true, required: true },
  email: { type: String, trim: true, lowercase: true, required: true },
  topic: { type: String, trim: true, default: "Other" },
  message: { type: String, trim: true, required: true },
  status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" }
}, { timestamps: true });

export default mongoose.model("SupportTicket", supportTicketSchema);
