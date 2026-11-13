import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: false }));
app.use(express.json({ limit: "2mb", verify: (req, res, buf) => { req.rawBody = Buffer.from(buf); } }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }), authRoutes);
app.use("/api/webhooks/whatsapp", webhookRoutes);
app.use("/api/contacts", requireAuth, contactRoutes);
app.use("/api/campaigns", requireAuth, campaignRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
export default app;
