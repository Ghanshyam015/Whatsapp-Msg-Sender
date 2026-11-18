import "dotenv/config";
import { Worker } from "bullmq";
import { connectDB } from "../config/db.js";
import { connection } from "./queue.js";
import Contact from "../models/Contact.js";
import MessageLog from "../models/MessageLog.js";
import Campaign from "../models/Campaign.js";
import { sendApprovedTemplate } from "../services/whatsappService.js";

await connectDB();
async function completeCampaignWhenDone(campaignId, workspaceId) {
  const campaign = await Campaign.findOne({ _id: campaignId, workspaceId }).select("accepted failed total");
  if (campaign && campaign.accepted + campaign.failed >= campaign.total) {
    await Campaign.updateOne({ _id: campaignId, workspaceId }, { $set: { status: "completed" } });
  }
}

const worker = new Worker("whatsapp-messages", async job => {
  const { campaignId, contactId, workspaceId, templateName, languageCode } = job.data;
  const contact = await Contact.findOne({ _id: contactId, workspaceId });
  const log = await MessageLog.findOne({ campaignId, contactId, workspaceId });
  if (!log) throw new Error("Message log entry not found for queued job");
  if (!contact || !contact.optedIn || contact.optedOutAt) {
    log.status = "failed";
    log.error = "Contact has not provided active opt-in";
    await log.save();
    await Campaign.updateOne({ _id: campaignId, workspaceId }, { $inc: { failed: 1 }, $set: { status: "processing" } });
    await completeCampaignWhenDone(campaignId, workspaceId);
    return;
  }
  await Campaign.updateOne({ _id: campaignId, workspaceId }, { $set: { status: "processing" } });
  try {
    const wamid = await sendApprovedTemplate({ to: contact.phone, templateName, languageCode });
    log.wamid = wamid;
    log.status = "accepted";
    log.sentAt = new Date();
    await log.save();
    await Campaign.updateOne({ _id: campaignId, workspaceId }, { $inc: { accepted: 1 } });
    await completeCampaignWhenDone(campaignId, workspaceId);
  } catch (error) {
    log.error = error.response?.data?.error?.message || error.message;
    await log.save();
    const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
    if (lastAttempt) {
      log.status = "failed";
      await log.save();
      await Campaign.updateOne({ _id: campaignId, workspaceId }, { $inc: { failed: 1 } });
      await completeCampaignWhenDone(campaignId, workspaceId);
    }
    throw error;
  }
}, { connection, concurrency: 2, limiter: { max: 20, duration: 1000 } });

worker.on("completed", job => console.log("Message job completed", job.id));
worker.on("failed", (job, err) => console.error("Message job failed", job?.id, err.message));
console.log("WhatsApp message worker running");
