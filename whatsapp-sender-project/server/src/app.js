import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { analyticsRouter, healthRouter, integrationsRouter, templatesRouter } from "./routes/integrationRoutes.js";
import { automationsRouter, groupsRouter, workspaceRouter } from "./routes/workspaceRoutes.js";
import { optionalAuth, requireAuth } from "./middleware/auth.js";

const app = express();
const trustProxyHops = Number(process.env.TRUST_PROXY ?? 1);
if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error("TRUST_PROXY must be a non-negative integer");
}
app.set("trust proxy", trustProxyHops);
app.use(helmet());
const clientOrigin = (process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL)?.replace(/\/+$/, "");
app.use(cors({ origin: clientOrigin, credentials: false }));
app.use(express.json({ limit: "2mb", verify: (req, res, buf) => { req.rawBody = Buffer.from(buf); } }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }), authRoutes);
app.use("/api/webhooks/whatsapp", webhookRoutes);
app.use("/api/contacts", requireAuth, contactRoutes);
app.use("/api/campaigns", requireAuth, campaignRoutes);
app.use("/api/workspace", requireAuth, workspaceRouter);
app.use("/api/groups", requireAuth, groupsRouter);
app.use("/api/automations", requireAuth, automationsRouter);
app.use("/api/team", requireAuth, teamRoutes);
app.use("/api/billing", requireAuth, billingRoutes);
app.use("/api/admin", requireAuth, adminRoutes);
app.use("/api/analytics", requireAuth, analyticsRouter);
app.use("/api/integrations", requireAuth, integrationsRouter);
app.use("/api/templates", requireAuth, templatesRouter);
app.use("/api/support", optionalAuth, rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }), supportRoutes);
app.use("/api/health", healthRouter);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
export default app;
