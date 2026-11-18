import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { emailIsConfigured, sendTeamInvitation } from "../services/emailService.js";

const router = Router();
router.get("/", asyncHandler(async (req, res) => {
  const [members, invitations] = await Promise.all([
    User.find({ workspaceId: req.user.workspaceId }).select("email name role emailVerified createdAt").sort({ createdAt: 1 }),
    Invitation.find({ workspaceId: req.user.workspaceId, acceptedAt: null, expiresAt: { $gt: new Date() } })
      .select("email role expiresAt createdAt").sort({ createdAt: -1 })
  ]);
  res.json({ members, invitations });
}));

router.post("/invites", asyncHandler(async (req, res) => {
  if (req.user.role !== "owner" && req.user.role !== "admin" && req.user.role !== "platform_admin") {
    return res.status(403).json({ error: "Workspace admin role required" });
  }
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const role = req.body?.role === "admin" ? "admin" : "member";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (!emailIsConfigured() || !process.env.APP_URL) return res.status(503).json({ error: "Email delivery and APP_URL must be configured to send invitations" });
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.workspaceId.toString() === req.user.workspaceId) return res.status(409).json({ error: "This person is already a workspace member" });
    return res.status(409).json({ error: "This email already belongs to another workspace" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const invitation = await Invitation.findOneAndUpdate(
    { workspaceId: req.user.workspaceId, email },
    {
      role,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      acceptedAt: null
    },
    { upsert: true, new: true, runValidators: true }
  );
  try {
    await sendTeamInvitation(email, token);
  } catch (error) {
    await Invitation.deleteOne({ _id: invitation._id });
    console.error("Could not send team invitation:", error.message);
    return res.status(502).json({ error: "Could not send the invitation email" });
  }
  res.status(201).json({ invitation: { email, role, expiresAt: invitation.expiresAt } });
}));

router.delete("/invites/:id", asyncHandler(async (req, res) => {
  if (req.user.role !== "owner" && req.user.role !== "admin" && req.user.role !== "platform_admin") {
    return res.status(403).json({ error: "Workspace admin role required" });
  }
  const result = await Invitation.deleteOne({ _id: req.params.id, workspaceId: req.user.workspaceId, acceptedAt: null });
  if (!result.deletedCount) return res.status(404).json({ error: "Invitation not found" });
  res.sendStatus(204);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  if (req.user.role !== "owner") return res.status(403).json({ error: "Workspace owner role required" });
  if (req.params.id === req.user.userId) return res.status(400).json({ error: "The workspace owner cannot remove themselves" });
  const result = await User.deleteOne({ _id: req.params.id, workspaceId: req.user.workspaceId, role: { $ne: "owner" } });
  if (!result.deletedCount) return res.status(404).json({ error: "Team member not found" });
  res.sendStatus(204);
}));

export default router;
