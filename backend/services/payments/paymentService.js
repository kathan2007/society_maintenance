import registry from "./registry.js";
import Order from "../../models/Order.js";
import Maintenance from "../../models/Maintenance.js";
import ProcessedEvent from "../../models/ProcessedEvent.js";
import socketManager from "../../utils/socketManager.js";
import { logAudit } from "../../models/AuditLog.js";

/**
 * Gateway-Agnostic Payment Business Logic Service
 * Enforces Golden Security Rules:
 * 1. Bill amount & currency fetched ONLY from Maintenance database record
 * 2. Ownership verification (bill must belong to authenticated user)
 * 3. Already-paid bills rejected
 * 4. Orders expire in 10 minutes
 * 5. Webhook verification + deduplication via ProcessedEvent
 * 6. Atomic state transition: Maintenance.findOneAndUpdate({ _id, status: "Pending" })
 * 7. Amount re-verification on webhook
 * 8. Kill-switch check (PAYMENTS_ENABLED)
 */

export class PaymentService {
  /**
   * Create a new payment order for a maintenance bill
   */
  async createOrder({ userId, maintenanceId, provider = "razorpay", idempotencyKey, ip, userAgent }) {
    // 0. Check global kill-switch
    if (process.env.PAYMENTS_ENABLED === "false") {
      throw new Error("Online payments are currently disabled by administrator.");
    }

    if (!maintenanceId) {
      throw new Error("Maintenance bill ID is required");
    }

    // 1. Fetch Maintenance record directly from DB (NEVER trust client amount)
    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance) {
      throw new Error("Maintenance record not found");
    }

    // 2. Prevent IDOR: bill must belong to the requesting user (unless admin)
    if (maintenance.userId.toString() !== userId.toString()) {
      throw new Error("Access forbidden: bill does not belong to you");
    }

    // 3. Prevent duplicate payment: already Paid bills cannot receive new orders
    if (maintenance.status === "Paid") {
      throw new Error("This maintenance bill is already paid");
    }

    // 4. Calculate exact total amount (amount + penalty)
    const penalty = maintenance.penalty || 0;
    const finalAmount = (maintenance.amount || 0) + penalty;
    if (finalAmount <= 0) {
      throw new Error("Invalid bill amount");
    }

    // 5. Idempotency: reuse existing open pending order if created recently
    const existingOrder = await Order.findOne({
      maintenanceId: maintenance._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingOrder) {
      return {
        orderId: existingOrder.orderId,
        amount: existingOrder.amount,
        currency: existingOrder.currency,
        qrCodeUrl: existingOrder.qrCodeUrl,
        expiresAt: existingOrder.expiresAt,
        baseAmount: maintenance.amount,
        penalty: maintenance.penalty,
        month: maintenance.month,
        gateway: existingOrder.gateway,
      };
    }

    // 6. Select gateway and create order
    const gateway = registry.getGateway(provider);
    const receipt = `BILL_${maintenance.month}_${maintenance._id.toString().slice(-6)}`;
    const gatewayOrder = await gateway.createOrder({
      amount: finalAmount,
      currency: "INR",
      receipt,
      metadata: {
        maintenanceId: maintenance._id.toString(),
        userId: userId.toString(),
      },
    });

    // 7. Persist order in DB with 10 minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const orderDoc = await Order.create({
      userId,
      maintenanceId: maintenance._id,
      orderId: gatewayOrder.orderId,
      gateway: gateway.name,
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      amount: finalAmount,
      currency: gatewayOrder.currency || "INR",
      status: "pending",
      qrCodeUrl: gatewayOrder.qrCodeUrl || null,
      idempotencyKey: idempotencyKey || null,
      expiresAt,
    });

    await logAudit({
      actorId: userId,
      role: "user",
      action: "PAYMENT_ORDER_CREATED",
      entity: "Order",
      entityId: orderDoc.orderId,
      after: { amount: finalAmount, maintenanceId: maintenance._id, gateway: gateway.name },
      ip,
      userAgent,
    });

    return {
      orderId: orderDoc.orderId,
      amount: finalAmount,
      currency: orderDoc.currency,
      qrCodeUrl: orderDoc.qrCodeUrl,
      expiresAt,
      baseAmount: maintenance.amount,
      penalty: maintenance.penalty,
      month: maintenance.month,
      gateway: gateway.name,
    };
  }

  /**
   * Process incoming verified webhook event
   */
  async processWebhook(provider, rawBody, headers, ip) {
    const gateway = registry.getGateway(provider);
    const verification = await gateway.verifyWebhook(rawBody, headers);

    if (!verification.isValid) {
      await logAudit({
        role: "system",
        action: "PAYMENT_WEBHOOK_SIGNATURE_FAILED",
        entity: "Webhook",
        entityId: provider,
        after: { reason: verification.reason },
        ip,
      });
      throw new Error(`Webhook verification failed: ${verification.reason}`);
    }

    const { eventId, eventType, orderId, paymentId, amount, currency } = verification;

    // Idempotency & Replay Defense: Check if this event was already processed
    const alreadyProcessed = await ProcessedEvent.findOne({ eventId });
    if (alreadyProcessed) {
      return { status: "already_processed", eventId };
    }

    // Record this event
    await ProcessedEvent.create({
      eventId,
      gateway: provider,
      eventType,
      orderId,
    });

    // Find the associated order
    const order = await Order.findOne({
      $or: [{ orderId }, { gatewayOrderId: orderId }],
    });

    if (!order) {
      return { status: "order_not_found", orderId };
    }

    // Handle payment success / captured
    if (eventType === "payment.captured" || eventType === "payment_intent.succeeded" || eventType === "checkout.session.completed") {
      // Re-verify Amount and Currency
      if (amount && Number(amount) !== Number(order.amount)) {
        await logAudit({
          role: "system",
          action: "PAYMENT_AMOUNT_MISMATCH",
          entity: "Order",
          entityId: order.orderId,
          before: { expectedAmount: order.amount },
          after: { receivedAmount: amount },
          ip,
        });
        order.status = "failed";
        await order.save();
        return { status: "amount_mismatch", orderId };
      }

      // Atomic transition: Update Order & Maintenance
      order.status = "success";
      order.gatewayPaymentId = paymentId;
      await order.save();

      if (order.maintenanceId) {
        // Atomic findOneAndUpdate prevents race conditions and double-marking
        const updatedBill = await Maintenance.findOneAndUpdate(
          { _id: order.maintenanceId, status: "Pending" },
          { status: "Paid", transactionId: paymentId || order.orderId },
          { new: true }
        );

        if (updatedBill) {
          await logAudit({
            actorId: order.userId,
            role: "system",
            action: "MAINTENANCE_BILL_PAID",
            entity: "Maintenance",
            entityId: order.maintenanceId.toString(),
            after: { status: "Paid", transactionId: paymentId, orderId: order.orderId },
            ip,
          });
        }
      }

      // Notify connected client over real-time WebSocket room
      try {
        socketManager.getIO().to(order.orderId).emit("payment:success", {
          orderId: order.orderId,
          transactionId: paymentId || order.orderId,
          amount: order.amount,
        });
        // Also emit legacy event name for backward compatibility
        socketManager.getIO().to(order.orderId).emit("paymentSuccess", {
          orderId: order.orderId,
          paymentId: paymentId || order.orderId,
        });
      } catch (err) {
        // socket broadcast error non-blocking
      }

      return { status: "payment_success", orderId: order.orderId };
    }

    if (eventType === "payment.failed" || eventType === "payment_intent.payment_failed") {
      order.status = "failed";
      await order.save();

      try {
        socketManager.getIO().to(order.orderId).emit("paymentFailed", { orderId: order.orderId });
      } catch (err) {}

      return { status: "payment_failed", orderId: order.orderId };
    }

    return { status: "unhandled_event", eventType };
  }
}

const paymentService = new PaymentService();
export default paymentService;
