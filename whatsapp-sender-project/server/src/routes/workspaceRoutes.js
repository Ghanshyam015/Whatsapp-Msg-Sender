import { Router } from "express";
import Contact from "../models/Contact.js";
import Workspace from "../models/Workspace.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const workspaceRouter = Router();
workspaceRouter.get("/", asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.user.workspaceId).select("name plan timezone settings groups automations createdAt");
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  res.json({ workspace });
}));

workspaceRouter.patch("/", asyncHandler(async (req, res) => {
  if (!["owner", "admin", "platform_admin"].includes(req.user.role)) return res.status(403).json({ error: "Workspace admin role required" });
  const updates = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) updates.name = req.body.name.trim();
  if (typeof req.body?.timezone === "string" && req.body.timezone.trim()) {
    try { new Intl.DateTimeFormat("en-US", { timeZone: req.body.timezone.trim() }); }
    catch { return res.status(400).json({ error: "Enter a valid IANA timezone" }); }
    updates.timezone = req.body.timezone.trim();
  }
  if (req.body?.settings && typeof req.body.settings === "object" && !Array.isArray(req.body.settings)) {
    const allowed = ["locale", "notificationsEnabled"];
    updates.settings = Object.fromEntries(allowed.filter(key => key in req.body.settings).map(key => [key, req.body.settings[key]]));
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: "Provide a workspace name, timezone, or supported settings" });
  const workspace = await Workspace.findByIdAndUpdate(req.user.workspaceId, { $set: updates }, { new: true, runValidators: true });
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  res.json({ workspace });
}));

const groupsRouter = Router();
groupsRouter.get("/", asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.user.workspaceId).select("groups");
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  res.json({ groups: workspace.groups });
}));
groupsRouter.post("/", asyncHandler(async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 80) return res.status(400).json({ error: "Group name must contain 1–80 characters" });
  const workspace = await Workspace.findByIdAndUpdate(req.user.workspaceId, { $push: { groups: { name } } }, { new: true });
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  res.status(201).json({ group: workspace.groups.at(-1) });
}));
groupsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const workspace = await Workspace.findOneAndUpdate(
    { _id: req.user.workspaceId, "groups._id": req.params.id },
    { $pull: { groups: { _id: req.params.id } } },
    { new: true }
  );
  if (!workspace) return res.status(404).json({ error: "Group not found" });
  await Contact.updateMany({ workspaceId: req.user.workspaceId }, { $pull: { groupIds: req.params.id } });
  res.sendStatus(204);
}));
groupsRouter.post("/:id/contacts", asyncHandler(async (req, res) => {
  const workspace = await Workspace.findOne({ _id: req.user.workspaceId, "groups._id": req.params.id }).select("_id");
  if (!workspace) return res.status(404).json({ error: "Group not found" });
  const contactIds = Array.isArray(req.body?.contactIds) ? req.body.contactIds : [];
  if (!contactIds.length || contactIds.length > 500) return res.status(400).json({ error: "Provide 1–500 contact IDs" });
  const result = await Contact.updateMany(
    { _id: { $in: contactIds }, workspaceId: req.user.workspaceId },
    { $addToSet: { groupIds: req.params.id } }
  );
  res.json({ updated: result.modifiedCount });
}));

const automationsRouter = Router();
automationsRouter.get("/", asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.user.workspaceId).select("automations");
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  res.json({ automations: workspace.automations });
}));
automationsRouter.post("/", asyncHandler(async (req, res) => {
  const { name, trigger, templateName } = req.body || {};
  if (typeof name !== "string" || !name.trim() || !["contact.created"].includes(trigger) || !/^[a-z0-9_]+$/.test(templateName || "")) {
    return res.status(400).json({ error: "Provide a name, contact.created trigger, and valid approved template name" });
  }
  const workspace = await Workspace.findByIdAndUpdate(
    req.user.workspaceId,
    { $push: { automations: { name: name.trim(), trigger, templateName, enabled: false } } },
    { new: true }
  );
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  res.status(201).json({ automation: workspace.automations.at(-1), message: "Automation saved disabled; execution is not available until a WhatsApp account is connected." });
}));
automationsRouter.patch("/:id", asyncHandler(async (req, res) => {
  if (typeof req.body?.enabled !== "boolean") return res.status(400).json({ error: "enabled must be a boolean" });
  if (req.body.enabled) return res.status(503).json({ error: "Automation execution is not implemented; rules cannot be enabled" });
  const workspace = await Workspace.findOneAndUpdate(
    { _id: req.user.workspaceId, "automations._id": req.params.id },
    { $set: { "automations.$.enabled": req.body.enabled } },
    { new: true }
  );
  if (!workspace) return res.status(404).json({ error: "Automation not found" });
  res.json({ automation: workspace.automations.id(req.params.id) });
}));
automationsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const workspace = await Workspace.findOneAndUpdate(
    { _id: req.user.workspaceId, "automations._id": req.params.id },
    { $pull: { automations: { _id: req.params.id } } }
  );
  if (!workspace) return res.status(404).json({ error: "Automation not found" });
  res.sendStatus(204);
}));

export { automationsRouter, groupsRouter, workspaceRouter };
