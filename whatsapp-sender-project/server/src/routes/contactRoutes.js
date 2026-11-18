import { Router } from "express";
import Contact from "../models/Contact.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
const router = Router();
const validPhone = value => typeof value === "string" && /^\d{8,15}$/.test(value);

router.get("/", asyncHandler(async (req, res) => {
  const filter = { workspaceId: req.user.workspaceId };
  const contacts = await Contact.find(filter).sort({ createdAt: -1 }).limit(1000);
  res.json({ contacts, total: await Contact.countDocuments(filter) });
}));
router.post("/", asyncHandler(async (req, res) => {
  const { name = "", phone, optedIn = false, consentSource = "", consentedAt } = req.body || {};
  if (typeof optedIn !== "boolean") return res.status(400).json({ error: "optedIn must be a boolean" });
  if (!validPhone(phone)) return res.status(400).json({ error: "Phone must be 8–15 digits with country code, no + or punctuation" });
  if (optedIn && (!consentSource || !consentedAt)) return res.status(400).json({ error: "Opt-in requires consentSource and consentedAt" });
  const consentDate = optedIn ? new Date(consentedAt) : null;
  if (optedIn && Number.isNaN(consentDate.getTime())) return res.status(400).json({ error: "consentedAt must be a valid date" });
  const contact = await Contact.findOneAndUpdate({ workspaceId: req.user.workspaceId, phone }, {
    workspaceId: req.user.workspaceId,
    name, phone, optedIn: Boolean(optedIn), consentSource,
    consentedAt: consentDate,
    optedOutAt: optedIn ? null : new Date()
  }, { upsert: true, new: true, runValidators: true });
  res.status(201).json({ contact });
}));
router.post("/import", asyncHandler(async (req, res) => {
  const rows = req.body?.contacts;
  if (!Array.isArray(rows) || rows.length > 5000) return res.status(400).json({ error: "contacts must be an array of up to 5000 records" });
  let imported = 0, skipped = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object" || !validPhone(row.phone) || row.optedIn !== true ||
      typeof row.consentSource !== "string" || !row.consentSource.trim() || typeof row.consentedAt !== "string" ||
      Number.isNaN(Date.parse(row.consentedAt))) { skipped++; continue; }
    await Contact.updateOne({ workspaceId: req.user.workspaceId, phone: row.phone }, {
      $set: { workspaceId: req.user.workspaceId, name: row.name || "", optedIn: true, consentSource: row.consentSource, consentedAt: new Date(row.consentedAt), optedOutAt: null }
    }, { upsert: true });
    imported++;
  }
  res.json({ imported, skipped });
}));
router.post("/:id/opt-out", asyncHandler(async (req, res) => {
  const contact = await Contact.findOneAndUpdate({ _id: req.params.id, workspaceId: req.user.workspaceId }, { optedIn: false, optedOutAt: new Date() }, { new: true });
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json({ contact });
}));
export default router;
