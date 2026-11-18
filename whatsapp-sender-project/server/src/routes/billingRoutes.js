import { Router } from "express";
import axios from "axios";
import crypto from "crypto";
import Contact from "../models/Contact.js";
import MessageLog from "../models/MessageLog.js";
import Workspace from "../models/Workspace.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
const plans = {
  starter: { name: "Starter", amount: 49900, contacts: 1000 },
  growth: { name: "Growth", amount: 149900, contacts: 10000 },
  business: { name: "Business", amount: 299900, contacts: 50000 }
};
const paymentAuth = () => ({ username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET });

router.get("/", asyncHandler(async (req, res) => {
  const [workspace, contacts, messages] = await Promise.all([
    Workspace.findById(req.user.workspaceId).select("plan billingStatus subscriptionExpiresAt"),
    Contact.countDocuments({ workspaceId: req.user.workspaceId }),
    MessageLog.countDocuments({ workspaceId: req.user.workspaceId, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } })
  ]);
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  res.json({
    subscription: workspace,
    usage: { contacts, messagesThisMonth: messages },
    plans: Object.entries(plans).map(([id, plan]) => ({ id, ...plan, amount: plan.amount / 100, currency: "INR" })),
    paymentsConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
}));

router.post("/checkout", asyncHandler(async (req, res) => {
  const planId = req.body?.plan;
  const plan = plans[planId];
  if (!plan) return res.status(400).json({ error: "Choose a valid subscription plan" });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ error: "Razorpay checkout is not configured on the server" });
  }
  try {
    const response = await axios.post("https://api.razorpay.com/v1/orders", {
      amount: plan.amount,
      currency: "INR",
      receipt: `ws-${req.user.workspaceId}-${Date.now()}`.slice(0, 40),
      notes: { workspaceId: req.user.workspaceId, plan: planId }
    }, { auth: paymentAuth(), timeout: 15000 });
    res.status(201).json({
      orderId: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: planId
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error.response?.data?.error?.description || error.message);
    res.status(502).json({ error: "Could not create a checkout order" });
  }
}));

router.post("/verify", asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body || {};
  if (![orderId, paymentId, signature].every(value => typeof value === "string" && value.length > 0) ||
    !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(400).json({ error: "A valid Razorpay order, payment, and signature are required" });
  }
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest();
  const supplied = Buffer.from(signature, "hex");
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return res.status(400).json({ error: "Payment signature is invalid" });
  }
  try {
    const [orderResponse, paymentResponse] = await Promise.all([
      axios.get(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, { auth: paymentAuth(), timeout: 15000 }),
      axios.get(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { auth: paymentAuth(), timeout: 15000 })
    ]);
    const order = orderResponse.data;
    const payment = paymentResponse.data;
    const plan = order.notes?.plan;
    if (order.notes?.workspaceId !== req.user.workspaceId || !plans[plan] ||
      order.amount !== plans[plan].amount || order.currency !== "INR" ||
      payment.order_id !== orderId || payment.amount !== plans[plan].amount ||
      payment.currency !== "INR" || payment.status !== "captured") {
      return res.status(400).json({ error: "Payment is not captured for this workspace and plan" });
    }
    const currentWorkspace = await Workspace.findById(req.user.workspaceId).select("subscriptionExpiresAt billingPaymentId");
    if (!currentWorkspace) return res.status(404).json({ error: "Workspace not found" });
    if (currentWorkspace.billingPaymentId === paymentId) {
      return res.json({ subscription: currentWorkspace });
    }
    const expiresFrom = Math.max(Date.now(), currentWorkspace.subscriptionExpiresAt?.getTime() || 0);
    const workspace = await Workspace.findByIdAndUpdate(req.user.workspaceId, {
      plan,
      billingStatus: "active",
      billingPaymentId: paymentId,
      subscriptionExpiresAt: new Date(expiresFrom + 30 * 24 * 60 * 60 * 1000)
    }, { new: true });
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });
    res.json({ subscription: workspace });
  } catch (error) {
    console.error("Razorpay payment verification failed:", error.response?.data?.error?.description || error.message);
    res.status(502).json({ error: "Could not verify the payment with Razorpay" });
  }
}));

export default router;
