import "dotenv/config";
import { Worker } from "bullmq";
import { connectDB } from "../config/db.js";
import { connection } from "./queue.js";
import Contact from "../models/Contact.js";
import MessageLog from "../models/MessageLog.js";
import Campaign from "../models/Campaign.js";
import { sendApprovedTemplate } from "../services/whatsappService.js";

await connectDB();
const worker = new Worker("whatsapp-messages", async job => {
  const { campaignId, contactId, templateName, languageCode } = job.data;
  const contact = await Contact.findById(contactId);
  const log = await MessageLog.findOne({ campaignId, contactId });
  if (!contact || !contact.optedIn || contact.optedOutAt) {
    if (log) { log.status = "failed"; log.error = "Contact has not provided active opt-in"; await log.save(); }
    await Campaign.updateOne({ _id: campaignId }, { $inc: { failed: 1 } });
    return;
  }
  try {
    const wamid = await sendApprovedTemplate({ to: contact.phone, templateName, languageCode });
    log.wamid = wamid;
    log.status = "accepted";
    log.sentAt = new Date();
    await log.save();
    await Campaign.updateOne({ _id: campaignId }, { $inc: { accepted: 1 } });
  } catch (error) {
    log.status = "failed";
    log.error = error.response?.data?.error?.message || error.message;
    await log.save();
    await Campaign.updateOne({ _id: campaignId }, { $inc: { failed: 1 } });
    throw error;
  }
}, { connection, concurrency: 2, limiter: { max: 20, duration: 1000 } });

worker.on("completed", job => console.log("Message job completed", job.id));
worker.on("failed", (job, err) => console.error("Message job failed", job?.id, err.message));
console.log("WhatsApp message worker running");
