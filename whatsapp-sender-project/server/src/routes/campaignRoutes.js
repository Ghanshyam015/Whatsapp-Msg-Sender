import { Router } from "express";
import Contact from "../models/Contact.js";
import Campaign from "../models/Campaign.js";
import MessageLog from "../models/MessageLog.js";
import { connection, messageQueue } from "../jobs/queue.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
const router = Router();

router.get("/", asyncHandler(async (req, res) => res.json({ campaigns: await Campaign.find({ workspaceId: req.user.workspaceId }).sort({ createdAt: -1 }).limit(100) })));
router.get("/logs", asyncHandler(async (req, res) => res.json({
  logs: await MessageLog.find({ workspaceId: req.user.workspaceId }).sort({ createdAt: -1 }).limit(1000).populate("campaignId", "name templateName")
})));
router.get("/:id/logs", asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, workspaceId: req.user.workspaceId }).select("_id");
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json({ logs: await MessageLog.find({ campaignId: campaign._id, workspaceId: req.user.workspaceId }).sort({ createdAt: -1 }).limit(1000) });
}));
router.post("/", asyncHandler(async (req, res) => {
  const { name, templateName, languageCode = "en_US", scheduledAt } = req.body || {};
  if (typeof name !== "string" || !name.trim() || typeof languageCode !== "string" ||
    !/^[a-z0-9_]+$/.test(templateName || "") || !/^[a-zA-Z0-9_-]{2,20}$/.test(languageCode)) {
    return res.status(400).json({ error: "Campaign name, valid approved template name, and valid language code are required" });
  }
  let scheduleDate;
  if (scheduledAt) {
    scheduleDate = new Date(scheduledAt);
    if (Number.isNaN(scheduleDate.getTime()) || scheduleDate.getTime() <= Date.now()) {
      return res.status(400).json({ error: "scheduledAt must be a valid future date" });
    }
  }
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return res.status(503).json({ error: "WhatsApp Cloud API credentials are not configured on the server" });
  }
  try {
    await connection.ping();
  } catch {
    return res.status(503).json({ error: "Campaign queue is unavailable. Check the Redis connection." });
  }
  const contacts = await Contact.find({ workspaceId: req.user.workspaceId, optedIn: true, optedOutAt: null }).select("_id phone");
  if (!contacts.length) return res.status(400).json({ error: "No opted-in contacts found" });
  const campaign = await Campaign.create({
    workspaceId: req.user.workspaceId, name: name.trim(), templateName, languageCode,
    scheduledAt: scheduleDate, status: scheduleDate ? "scheduled" : "processing",
    total: contacts.length, createdBy: req.user.email
  });
  const logs = contacts.map(c => ({ workspaceId: req.user.workspaceId, campaignId: campaign._id, contactId: c._id, phone: c.phone, status: "queued" }));
  const delay = scheduleDate ? scheduleDate.getTime() - Date.now() : 0;
  try {
    await MessageLog.insertMany(logs);
    await messageQueue.addBulk(contacts.map(c => ({
      name: "send-template",
      data: { campaignId: campaign._id.toString(), contactId: c._id.toString(), workspaceId: req.user.workspaceId, templateName, languageCode },
      opts: { delay, attempts: 2, backoff: { type: "exponential", delay: 3000 }, removeOnComplete: 1000, removeOnFail: 2000 }
    })));
  } catch (error) {
    await MessageLog.deleteMany({ campaignId: campaign._id, workspaceId: req.user.workspaceId });
    await Campaign.deleteOne({ _id: campaign._id, workspaceId: req.user.workspaceId });
    throw error;
  }
  res.status(202).json({ campaign });
}));
router.get("/:id", asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, workspaceId: req.user.workspaceId });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json({ campaign });
}));
export default router;
