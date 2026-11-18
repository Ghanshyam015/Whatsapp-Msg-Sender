import { Router } from "express";
import crypto from "crypto";
import MessageLog from "../models/MessageLog.js";
const router = Router();

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (!process.env.WEBHOOK_VERIFY_TOKEN) return res.status(503).json({ error: "Webhook verification is not configured" });
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN && typeof challenge === "string") return res.status(200).send(challenge);
  res.sendStatus(403);
});
router.post("/", async (req, res) => {
  const signature = req.get("x-hub-signature-256");
  if (!process.env.META_APP_SECRET) return res.status(503).json({ error: "Webhook signature verification is not configured" });
  const expected = "sha256=" + crypto.createHmac("sha256", process.env.META_APP_SECRET).update(req.rawBody || Buffer.from(JSON.stringify(req.body))).digest("hex");
  const a = Buffer.from(signature || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.sendStatus(401);
  try {
    for (const entry of req.body?.entry || []) for (const change of entry.changes || []) {
      for (const status of change.value?.statuses || []) {
        if (!["sent", "delivered", "read", "failed"].includes(status.status)) continue;
        const log = await MessageLog.findOne({ wamid: status.id });
        if (!log) continue;
        const priorStatus = log.status;
        log.status = status.status;
        if (status.status === "delivered") log.deliveredAt = new Date();
        if (status.status === "read") log.readAt = new Date();
        if (status.status === "failed") log.error = JSON.stringify(status.errors || []);
        await log.save();
        if (status.status === "delivered" && priorStatus !== "delivered" && priorStatus !== "read") {
          await Campaign.updateOne({ _id: log.campaignId, workspaceId: log.workspaceId }, { $inc: { delivered: 1 } });
        }
        if (status.status === "read" && priorStatus !== "read") {
          await Campaign.updateOne({ _id: log.campaignId, workspaceId: log.workspaceId }, { $inc: { read: 1 } });
        }
      }
    }
    res.sendStatus(200);
  } catch (e) { console.error(e); res.sendStatus(500); }
});
export default router;
