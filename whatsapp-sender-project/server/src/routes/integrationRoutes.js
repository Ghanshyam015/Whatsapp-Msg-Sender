import { Router } from "express";
import axios from "axios";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import Campaign from "../models/Campaign.js";
import MessageLog from "../models/MessageLog.js";
import { connection } from "../jobs/queue.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const integrationsRouter = Router();
integrationsRouter.get("/", asyncHandler(async (req, res) => {
  let queueConnected = false;
  try { queueConnected = (await connection.ping()) === "PONG"; } catch { queueConnected = false; }
  res.json({
    api: { connected: true },
    database: { connected: mongoose.connection.readyState === 1 },
    queue: { connected: queueConnected },
    whatsapp: {
      configured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      templatesConfigured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_BUSINESS_ACCOUNT_ID),
      webhookConfigured: Boolean(process.env.WEBHOOK_VERIFY_TOKEN)
    },
    email: { configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM) },
    payments: { configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) }
  });
}));

const templatesRouter = Router();
templatesRouter.get("/", asyncHandler(async (req, res) => {
  const { WHATSAPP_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_API_VERSION = "v25.0" } = process.env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID) {
    return res.status(503).json({ error: "WhatsApp template sync is not configured on the server" });
  }
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }, params: { fields: "name,status,language,category", limit: 100 }, timeout: 15000 }
    );
    res.json({ templates: response.data?.data || [] });
  } catch (error) {
    console.error("WhatsApp template sync failed:", error.response?.data?.error?.message || error.message);
    res.status(502).json({ error: "Could not load templates from Meta. Check server credentials and try again." });
  }
}));

const analyticsRouter = Router();
analyticsRouter.get("/", asyncHandler(async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const [contacts, campaigns, messageStatus] = await Promise.all([
    Contact.countDocuments({ workspaceId }),
    Campaign.aggregate([
      { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
      { $group: { _id: null, campaigns: { $sum: 1 }, accepted: { $sum: "$accepted" }, failed: { $sum: "$failed" } } }
    ]),
    MessageLog.aggregate([
      { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ]);
  const statuses = Object.fromEntries(messageStatus.map(entry => [entry._id, entry.count]));
  res.json({
    contacts,
    campaigns: campaigns[0]?.campaigns || 0,
    accepted: campaigns[0]?.accepted || 0,
    failed: campaigns[0]?.failed || 0,
    delivered: (statuses.delivered || 0) + (statuses.read || 0),
    read: statuses.read || 0,
    queued: statuses.queued || 0
  });
}));

const healthRouter = Router();
healthRouter.get("/", (req, res) => res.json({ ok: true }));
healthRouter.get("/ready", asyncHandler(async (req, res) => {
  const database = mongoose.connection.readyState === 1;
  let queue = false;
  try {
    queue = (await connection.ping()) === "PONG";
  } catch {
    queue = false;
  }
  const ready = database && queue;
  res.status(ready ? 200 : 503).json({
    ok: ready,
    dependencies: { database: database ? "connected" : "disconnected", queue: queue ? "connected" : "disconnected" }
  });
}));

export { analyticsRouter, healthRouter, integrationsRouter, templatesRouter };
