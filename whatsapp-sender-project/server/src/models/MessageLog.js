import mongoose from "mongoose";
const schema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
  phone: String,
  wamid: { type: String, index: true, sparse: true },
  status: { type: String, enum: ["queued", "accepted", "sent", "delivered", "read", "failed"], default: "queued" },
  error: String,
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date
}, { timestamps: true });
export default mongoose.model("MessageLog", schema);
