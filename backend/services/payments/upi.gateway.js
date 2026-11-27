import crypto from "crypto";
import PaymentGateway from "./PaymentGateway.js";

/**
 * Custom UPI QR Payment Gateway
 * Enforces strict server-side generation of QR payload with amount lock
 */
export default class UpiGateway extends PaymentGateway {
  constructor() {
    super("upi");
  }

  async createOrder({ amount, currency = "INR", receipt }) {
    const orderId = `upi_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const upiId = process.env.UPI_ID || process.env.VPA_ID || "society@axl";
    const payeeName = encodeURIComponent(process.env.UPI_PAYEE_NAME || "SHREE HARI GIFT CITY");

    // Build locked UPI URI (am fixed, currency INR, tr tied to orderId)
    const qrCodeUrl = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(receipt || "Society Maintenance")}`;

    return {
      orderId,
      gatewayOrderId: orderId,
      amount,
      currency: "INR",
      qrCodeUrl,
    };
  }

  async verifyWebhook(rawBody, headers) {
    // Custom webhook for bank/PSP callbacks
    const secret = process.env.UPI_WEBHOOK_SECRET || process.env.JWT_SECRET;
    const signature = headers["x-upi-signature"] || headers["x-webhook-signature"];

    if (!signature) {
      return { isValid: false, reason: "Missing signature" };
    }

    const rawString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const expected = crypto.createHmac("sha256", secret).update(rawString).digest("hex");

    const isValid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));

    if (!isValid) {
      return { isValid: false, reason: "Invalid signature" };
    }

    const body = JSON.parse(rawString);
    return {
      isValid: true,
      eventId: body.eventId || body.transactionId || crypto.randomUUID(),
      eventType: body.status === "SUCCESS" ? "payment.captured" : "payment.failed",
      orderId: body.orderId || body.tr,
      paymentId: body.transactionId || body.utr,
      amount: Number(body.amount),
      currency: "INR",
      rawEvent: body,
    };
  }

  async fetchPayment(paymentId) {
    return { status: "pending", paymentId };
  }

  async refund() {
    throw new Error("UPI direct refund not supported via automated gateway");
  }
}
