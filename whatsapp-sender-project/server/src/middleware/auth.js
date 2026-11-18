import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    if (!token) throw new Error("Missing token");
    if (!process.env.JWT_SECRET) throw new Error("JWT secret is not configured");
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user.workspaceId) throw new Error("Missing workspace scope");
    if (user.userId) {
      const account = await User.findById(user.userId).select("email role workspaceId authVersion emailVerified");
      if (!account || !account.emailVerified || account.authVersion !== user.authVersion) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      user.email = account.email;
      user.role = account.role;
      user.workspaceId = account.workspaceId.toString();
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return requireAuth(req, res, next);
}
