import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const router = Router();
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, email });
});
export default router;
