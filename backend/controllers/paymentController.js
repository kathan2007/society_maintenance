import paymentService from "../services/payments/paymentService.js";
import Order from "../models/Order.js";

/**
 * Create Order Controller
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, maintenanceId, provider, idempotencyKey } = req.body;

    const result = await paymentService.createOrder({
      userId: req.user.id,
      maintenanceId,
      amount,
      provider: provider || "razorpay",
      idempotencyKey,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const statusCode = err.message.includes("forbidden") ? 403 :
                       err.message.includes("already paid") ? 409 : 400;
    res.status(statusCode).json({ message: err.message });
  }
};

/**
 * Order Status Polling Controller
 */
export const getStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: "Order records not found" });
    }

    // IDOR protection: only owner or admin can inspect order status
    if (req.user.role !== "admin" && order.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Access forbidden" });
    }

    res.json({
      status: order.status,
      orderId: order.orderId,
      amount: order.amount,
      gatewayPaymentId: order.gatewayPaymentId,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal status fetch error" });
  }
};

/**
 * Gateway Webhook Handler
 */
export const handleWebhook = (provider) => {
  return async (req, res) => {
    try {
      const rawBody = req.body;
      const headers = req.headers;
      const ip = req.ip;

      const result = await paymentService.processWebhook(provider, rawBody, headers, ip);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
};
