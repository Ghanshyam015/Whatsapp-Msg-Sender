import { Router } from "express";
import SupportTicket from "../models/SupportTicket.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.post("/", asyncHandler(async (req, res) => {
  const { name, email, topic = "Other", message } = req.body || {};
  if (typeof name !== "string" || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "") ||
    typeof message !== "string" || message.trim().length < 10 || message.length > 5000) {
    return res.status(400).json({ error: "Provide your name, a valid email address, and a message of 10–5000 characters" });
  }
  const ticket = await SupportTicket.create({
    workspaceId: req.user?.workspaceId,
    name: name.trim(), email: email.trim().toLowerCase(), topic: String(topic).slice(0, 100),
    message: message.trim()
  });
  res.status(201).json({ ticket: { id: ticket._id, status: ticket.status, createdAt: ticket.createdAt } });
}));

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ workspaceId: req.user.workspaceId }).sort({ createdAt: -1 }).limit(200);
  res.json({ tickets });
}));

router.patch("/:id", requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== "owner" && req.user.role !== "admin" && req.user.role !== "platform_admin") {
    return res.status(403).json({ error: "Workspace admin role required" });
  }
  const status = req.body?.status;
  if (!["open", "in_progress", "closed"].includes(status)) return res.status(400).json({ error: "Invalid ticket status" });
  const ticket = await SupportTicket.findOneAndUpdate(
    { _id: req.params.id, workspaceId: req.user.workspaceId },
    { status },
    { new: true, runValidators: true }
  );
  if (!ticket) return res.status(404).json({ error: "Support request not found" });
  res.json({ ticket });
}));

export default router;
