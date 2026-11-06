import express from "express";
import { createOrder, getStatus, handleWebhook } from "../controllers/paymentController.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// Order Creation
router.post("/create-order", verifyToken, createOrder);

// Status Polling
router.get("/status/:orderId", verifyToken, getStatus);

// Webhook for Gateway Events
router.post("/webhook", handleWebhook);

export default router;
