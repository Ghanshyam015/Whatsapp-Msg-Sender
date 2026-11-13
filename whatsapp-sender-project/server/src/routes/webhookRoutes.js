import { Router } from "express";
import crypto from "crypto";
import MessageLog from "../models/MessageLog.js";
const router = Router();

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});
router.post("/", async (req, res) => {
  const signature = req.get("x-hub-signature-256");
  if (process.env.META_APP_SECRET) {
    const expected = "sha256=" + crypto.createHmac("sha256", process.env.META_APP_SECRET).update(req.rawBody || Buffer.from(JSON.stringify(req.body))).digest("hex");
    const a = Buffer.from(signature || "");
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.sendStatus(401);
  }
  try {
    for (const entry of req.body?.entry || []) for (const change of entry.changes || []) {
      for (const status of change.value?.statuses || []) {
        const update = { status: status.status };
        if (status.status === "delivered") update.deliveredAt = new Date();
        if (status.status === "read") update.readAt = new Date();
        if (status.status === "failed") update.error = JSON.stringify(status.errors || []);
        await MessageLog.findOneAndUpdate({ wamid: status.id }, { $set: update });
      }
    }
    res.sendStatus(200);
  } catch (e) { console.error(e); res.sendStatus(500); }
});
export default router;
