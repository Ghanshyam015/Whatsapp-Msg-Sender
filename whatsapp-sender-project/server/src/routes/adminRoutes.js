import { Router } from "express";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.get("/workspaces", asyncHandler(async (req, res) => {
  if (req.user.role !== "platform_admin") return res.status(403).json({ error: "Platform administrator role required" });
  const workspaces = await Workspace.find().sort({ createdAt: -1 }).limit(500).lean();
  const ownerIds = workspaces.map(workspace => workspace.ownerId).filter(Boolean);
  const owners = await User.find({ _id: { $in: ownerIds } }).select("email name").lean();
  const ownersById = new Map(owners.map(owner => [owner._id.toString(), owner]));
  res.json({
    workspaces: workspaces.map(workspace => ({ ...workspace, owner: ownersById.get(workspace.ownerId?.toString()) || null }))
  });
}));

export default router;
