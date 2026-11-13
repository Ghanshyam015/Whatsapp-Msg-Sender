import { Router } from "express";
import Contact from "../models/Contact.js";
const router = Router();
const validPhone = value => typeof value === "string" && /^\d{8,15}$/.test(value);

router.get("/", async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 }).limit(1000);
  res.json({ contacts, total: await Contact.countDocuments() });
});
router.post("/", async (req, res) => {
  const { name = "", phone, optedIn = false, consentSource = "", consentedAt } = req.body || {};
  if (!validPhone(phone)) return res.status(400).json({ error: "Phone must be 8–15 digits with country code, no + or punctuation" });
  if (optedIn && (!consentSource || !consentedAt)) return res.status(400).json({ error: "Opt-in requires consentSource and consentedAt" });
  const contact = await Contact.findOneAndUpdate({ phone }, {
    name, phone, optedIn: Boolean(optedIn), consentSource,
    consentedAt: optedIn ? new Date(consentedAt) : null,
    optedOutAt: optedIn ? null : new Date()
  }, { upsert: true, new: true, runValidators: true });
  res.status(201).json({ contact });
});
router.post("/import", async (req, res) => {
  const rows = req.body?.contacts;
  if (!Array.isArray(rows) || rows.length > 5000) return res.status(400).json({ error: "contacts must be an array of up to 5000 records" });
  let imported = 0, skipped = 0;
  for (const row of rows) {
    if (!validPhone(row.phone) || !row.optedIn || !row.consentSource || !row.consentedAt) { skipped++; continue; }
    await Contact.updateOne({ phone: row.phone }, {
      $set: { name: row.name || "", optedIn: true, consentSource: row.consentSource, consentedAt: new Date(row.consentedAt), optedOutAt: null }
    }, { upsert: true });
    imported++;
  }
  res.json({ imported, skipped });
});
router.post("/:id/opt-out", async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { optedIn: false, optedOutAt: new Date() }, { new: true });
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json({ contact });
});
export default router;
