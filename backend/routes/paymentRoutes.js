import express from "express";
import { createOrder, getStatus, handleWebhook } from "../controllers/paymentController.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// Order Creation
router.post("/create-order", verifyToken, createOrder);

// Status Polling
router.get("/status/:orderId", verifyToken, getStatus);

// Raw body parser for webhooks (required for signature verification)
const rawJsonParser = express.raw({ type: "application/json", limit: "1mb" });

// Provider-specific Webhooks
router.post("/webhook/razorpay", rawJsonParser, handleWebhook("razorpay"));
router.post("/webhook/stripe", rawJsonParser, handleWebhook("stripe"));
router.post("/webhook/upi", rawJsonParser, handleWebhook("upi"));

// Backward-compatible generic webhook route
router.post("/webhook", rawJsonParser, handleWebhook("razorpay"));

export default router;
