import { createRazorpayOrder, generateUpiIntent } from "../services/paymentService.js";
import Order from "../models/Order.js";
import Maintenance from "../models/Maintenance.js";
import socketManager from "../utils/socketManager.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const { amount, maintenanceId } = req.body;
    console.log(`Payment Request Received: Amount=${amount}, ID=${maintenanceId}`);

    if (!amount) return res.status(400).json({ message: "Amount is required" });

    // Lookup Maintenance record for breakdown
    let maintenance = null;
    if (maintenanceId && maintenanceId.length === 24) {
       maintenance = await Maintenance.findById(maintenanceId);
    }

    // 0. Mock Mode Logic (if keys are generic or missing)
    const isMock = !process.env.RAZORPAY_KEY_ID || 
                   process.env.RAZORPAY_KEY_ID.includes("YOUR_KEY") || 
                   process.env.RAZORPAY_KEY_ID === "rzp_test_example";

    let rzpOrder;
    let upiIntent;

    if (isMock) {
       console.log("⚠️ PAYMENT MOCK MODE: Generating dummy order for testing.");
       rzpOrder = { id: `order_mock_${Math.random().toString(36).substring(7)}` };
       // Dummy UPI intent for testing UI
       const testPa = process.env.VPA_ID || "9898216064@axl";
       const testPn = encodeURIComponent("SOCIETY TEST PORTAL");
       upiIntent = `upi://pay?pa=${testPa}&pn=${testPn}&am=${amount}&cu=INR&tr=${rzpOrder.id}`;
    } else {
       // 1. Create Order in Razorpay via Service
       rzpOrder = await createRazorpayOrder(amount);
       // 2. Generate UPI Intent for the QR
       upiIntent = generateUpiIntent(amount, rzpOrder.id);
    }
    
    // 3. Persist Order in DB
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Set 5 mins expiry
    const newOrder = new Order({
      userId: req.user.id,
      amount,
      orderId: rzpOrder.id,
      status: "pending",
      qrCodeUrl: upiIntent,
      maintenanceId: maintenanceId || null,
      expiresAt: expiresAt
    });

    await newOrder.save();

    res.json({
      success: true,
      orderId: rzpOrder.id,
      qrCodeUrl: upiIntent, 
      expiresAt: expiresAt,
      amount,
      baseAmount: maintenance?.amount || amount,
      penalty: maintenance?.penalty || 0,
      month: maintenance?.month || "Current Period",
      upiId: process.env.VPA_ID || "9898216064@axl"
    });

  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(500).json({ message: "Error creating payment order", error: err.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: "Order records not found" });
    res.json({ status: order.status, orderId: order.orderId });
  } catch (err) {
    res.status(500).json({ message: "Internal status fetch error" });
  }
};

export const handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEB_SECRET || "123456";
  const signature = req.headers["x-razorpay-signature"];

  try {
    const bodyString = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyString)
      .digest("hex");

    if (expectedSignature === signature) {
      const { payload, event } = req.body;
      const paymentEntity = payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const order = await Order.findOne({ orderId: rzpOrderId });
      if (order) {
        if (event === "payment.captured") {
          order.status = "success";
          order.paymentId = paymentId;
          await order.save();

          if (order.maintenanceId) {
            await Maintenance.findByIdAndUpdate(order.maintenanceId, {
              status: "Paid",
              transactionId: paymentId
            });
          }

          // Emit Success Event with Room based on orderId
          socketManager.getIO().to(rzpOrderId).emit("paymentSuccess", { orderId: rzpOrderId, paymentId });
          console.log(`WEBHOOK: Payment captured for ${rzpOrderId}`);
        } else if (event === "payment.failed") {
          order.status = "failed";
          await order.save();
          socketManager.getIO().to(rzpOrderId).emit("paymentFailed", { orderId: rzpOrderId });
        }
      }
      res.json({ status: "processed" });
    } else {
      res.status(400).send("Unauthorized Webhook signature");
    }
  } catch (err) {
    console.error("Webhook server error:", err);
    res.status(500).json({ status: "internal_error" });
  }
};
