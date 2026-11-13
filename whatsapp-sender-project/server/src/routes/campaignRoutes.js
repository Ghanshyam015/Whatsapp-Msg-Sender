import { Router } from "express";
import Contact from "../models/Contact.js";
import Campaign from "../models/Campaign.js";
import MessageLog from "../models/MessageLog.js";
import { messageQueue } from "../jobs/queue.js";
const router = Router();

router.get("/", async (req, res) => res.json({ campaigns: await Campaign.find().sort({ createdAt: -1 }).limit(100) }));
router.get("/:id/logs", async (req, res) => res.json({ logs: await MessageLog.find({ campaignId: req.params.id }).sort({ createdAt: -1 }).limit(1000) }));
router.post("/", async (req, res) => {
  const { name, templateName, languageCode = "en_US" } = req.body || {};
  if (!name?.trim() || !/^[a-z0-9_]+$/.test(templateName || "")) return res.status(400).json({ error: "Campaign name and valid approved template name are required" });
  const contacts = await Contact.find({ optedIn: true, optedOutAt: null }).select("_id");
  if (!contacts.length) return res.status(400).json({ error: "No opted-in contacts found" });
  const campaign = await Campaign.create({ name, templateName, languageCode, total: contacts.length, createdBy: req.user.email });
  const logs = contacts.map(c => ({ campaignId: campaign._id, contactId: c._id, status: "queued" }));
  await MessageLog.insertMany(logs);
  await Campaign.updateOne({ _id: campaign._id }, { status: "processing" });
  await messageQueue.addBulk(contacts.map(c => ({
    name: "send-template",
    data: { campaignId: campaign._id.toString(), contactId: c._id.toString(), templateName, languageCode },
    opts: { attempts: 2, backoff: { type: "exponential", delay: 3000 }, removeOnComplete: 1000, removeOnFail: 2000 }
  })));
  res.status(202).json({ campaign: { ...campaign.toObject(), status: "processing" } });
});
router.get("/:id", async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json({ campaign });
});
export default router;
