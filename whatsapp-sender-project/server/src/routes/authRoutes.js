import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import Invitation from "../models/Invitation.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { emailIsConfigured, sendVerificationCode } from "../services/emailService.js";

const router = Router();
const codeLifetimeMs = 15 * 60 * 1000;
const normalizeEmail = value => typeof value === "string" ? value.trim().toLowerCase() : "";
const codeHash = (email, code) => crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${email}:${code}`).digest();
const codesMatch = (email, code, storedHash) => {
  if (!storedHash) return false;
  const expected = codeHash(email, code);
  const stored = Buffer.from(storedHash, "hex");
  return expected.length === stored.length && crypto.timingSafeEqual(expected, stored);
};
const makeCode = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

function createToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("Authentication is not configured on the server");
  return jwt.sign({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId.toString(),
    authVersion: user.authVersion
  }, process.env.JWT_SECRET, { expiresIn: "8h" });
}

router.post("/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const workspaceName = typeof req.body?.business === "string" ? req.body.business.trim() : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const inviteToken = typeof req.body?.inviteToken === "string" ? req.body.inviteToken : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (!workspaceName && !inviteToken) || typeof password !== "string" ||
      password.length < 12 || Buffer.byteLength(password) > 72) {
      return res.status(400).json({ error: "Provide a valid email, business name (unless accepting an invite), and a 12–72 byte password" });
    }
    if (!process.env.JWT_SECRET) return res.status(503).json({ error: "Authentication is not configured on the server" });
    if (!emailIsConfigured()) return res.status(503).json({ error: "Email delivery is not configured on the server" });
    if (await User.exists({ email })) return res.status(409).json({ error: "An account with this email already exists" });

    const invite = inviteToken
      ? await Invitation.findOne({ email, tokenHash: crypto.createHash("sha256").update(inviteToken).digest("hex"), expiresAt: { $gt: new Date() }, acceptedAt: null })
      : null;
    if (inviteToken && !invite) return res.status(400).json({ error: "The team invitation is invalid or expired" });
    const workspace = invite ? await Workspace.findById(invite.workspaceId) : await Workspace.create({ name: workspaceName });
    if (!workspace) return res.status(400).json({ error: "The invited workspace no longer exists" });
    const code = makeCode();
    const user = await User.create({
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      workspaceId: workspace._id,
      role: invite?.role || "owner",
      invitationId: invite?._id,
      verificationCodeHash: codeHash(email, code).toString("hex"),
      verificationExpiresAt: new Date(Date.now() + codeLifetimeMs)
    });
    if (!invite) {
      workspace.ownerId = user._id;
      await workspace.save();
    }

    try {
      await sendVerificationCode(email, code, "verification");
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      if (!invite) await Workspace.deleteOne({ _id: workspace._id });
      console.error("Could not send account verification email:", error.message);
      return res.status(502).json({ error: "Could not send the verification email. Check SMTP configuration and try again." });
    }
    return res.status(201).json({ message: "Verification email sent. Enter the 6-digit code to finish creating your account." });
  } catch (error) {
    console.error("Registration failed:", error.message);
    return res.status(500).json({ error: "Could not create the account" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    const user = await User.findOne({ email });
    if (!user || user.emailVerified || !/^\d{6}$/.test(code) ||
      user.verificationExpiresAt < new Date() || !codesMatch(email, code, user.verificationCodeHash)) {
      return res.status(400).json({ error: "The verification code is invalid or expired" });
    }

    user.emailVerified = true;
    user.verificationCodeHash = undefined;
    user.verificationExpiresAt = undefined;
    await user.save();
    if (user.invitationId) await Invitation.updateOne({ _id: user.invitationId }, { acceptedAt: new Date() });
    return res.json({ token: createToken(user), user: { email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Email verification failed:", error.message);
    return res.status(500).json({ error: "Could not verify the email address" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!emailIsConfigured()) return res.status(503).json({ error: "Email delivery is not configured on the server" });
    const user = await User.findOne({ email, emailVerified: false });
    if (!user) return res.status(404).json({ error: "No unverified account was found for this email" });

    const code = makeCode();
    user.verificationCodeHash = codeHash(email, code).toString("hex");
    user.verificationExpiresAt = new Date(Date.now() + codeLifetimeMs);
    await user.save();
    await sendVerificationCode(email, code, "verification");
    return res.json({ message: "A new verification code was sent" });
  } catch (error) {
    console.error("Could not resend verification email:", error.message);
    return res.status(502).json({ error: "Could not send the verification email" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD &&
        email === normalizeEmail(process.env.ADMIN_EMAIL) && password === process.env.ADMIN_PASSWORD) {
        if (!process.env.JWT_SECRET) return res.status(503).json({ error: "Authentication is not configured on the server" });
        const workspace = await Workspace.findOneAndUpdate(
          { name: "Admin workspace" },
          { $setOnInsert: { name: "Admin workspace", plan: "business" } },
          { upsert: true, new: true }
        );
        const token = jwt.sign({
          email,
          role: "platform_admin",
          workspaceId: workspace._id.toString()
        }, process.env.JWT_SECRET, { expiresIn: "8h" });
        return res.json({ token, email });
      }
      if (!user && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
        return res.status(503).json({
          error: "Admin sign-in is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD on the server, or register and verify a user account."
        });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.emailVerified) return res.status(403).json({ error: "Verify your email address before signing in" });
    return res.json({ token: createToken(user), email: user.email });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({ error: "Could not sign in" });
  }
});

router.post("/password-reset/request", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!emailIsConfigured()) return res.status(503).json({ error: "Email delivery is not configured on the server" });
    const user = await User.findOne({ email, emailVerified: true });
    if (!user) return res.json({ message: "If an account exists for this email, a reset code has been sent." });

    const code = makeCode();
    user.resetCodeHash = codeHash(email, code).toString("hex");
    user.resetExpiresAt = new Date(Date.now() + codeLifetimeMs);
    await user.save();
    await sendVerificationCode(email, code, "reset");
    return res.json({ message: "If an account exists for this email, a reset code has been sent." });
  } catch (error) {
    console.error("Could not send password reset email:", error.message);
    return res.status(502).json({ error: "Could not send the password reset email" });
  }
});

router.post("/password-reset/confirm", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (password.length < 12 || Buffer.byteLength(password) > 72) return res.status(400).json({ error: "Password must be 12–72 bytes long" });
    const user = await User.findOne({ email, emailVerified: true });
    if (!user || !/^\d{6}$/.test(code) || user.resetExpiresAt < new Date() ||
      !codesMatch(email, code, user.resetCodeHash)) {
      return res.status(400).json({ error: "The reset code is invalid or expired" });
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    user.authVersion += 1;
    user.resetCodeHash = undefined;
    user.resetExpiresAt = undefined;
    await user.save();
    return res.json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    console.error("Password reset failed:", error.message);
    return res.status(500).json({ error: "Could not reset the password" });
  }
});

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  if (!req.user.userId) {
    return res.json({ user: { email: req.user.email, role: req.user.role } });
  }
  const user = await User.findById(req.user.userId).select("email name role workspaceId");
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ user: { email: user.email, name: user.name, role: user.role, workspaceId: user.workspaceId } });
}));

export default router;
