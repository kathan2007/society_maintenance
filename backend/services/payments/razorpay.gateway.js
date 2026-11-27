import crypto from "crypto";
import razorpayInstance from "../../config/razorpay.js";
import PaymentGateway from "./PaymentGateway.js";

/**
 * Razorpay Payment Gateway Adapter
 */
export default class RazorpayGateway extends PaymentGateway {
  constructor() {
    super("razorpay");
  }

  async createOrder({ amount, currency = "INR", receipt, notes = {} }) {
    const isMock = !process.env.RAZORPAY_KEY_ID ||
                   process.env.RAZORPAY_KEY_ID.includes("YOUR_KEY") ||
                   process.env.RAZORPAY_KEY_ID === "rzp_test_example";

    if (isMock) {
      const mockId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
      const upiId = process.env.UPI_ID || process.env.VPA_ID || "society@upi";
      const qrCodeUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent("SHREE HARI GIFT CITY")}&am=${amount}&cu=INR&tr=${mockId}`;
      return {
        orderId: mockId,
        gatewayOrderId: mockId,
        amount,
        currency,
        qrCodeUrl,
      };
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    };

    const rzpOrder = await razorpayInstance.orders.create(options);
    const upiId = process.env.UPI_ID || process.env.VPA_ID || "society@upi";
    const qrCodeUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent("SHREE HARI GIFT CITY")}&am=${amount}&cu=INR&tr=${rzpOrder.id}`;

    return {
      orderId: rzpOrder.id,
      gatewayOrderId: rzpOrder.id,
      amount,
      currency,
      qrCodeUrl,
    };
  }

  async verifyWebhook(rawBody, headers) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEB_SECRET || "123456";
    const signature = headers["x-razorpay-signature"];

    if (!signature) {
      return { isValid: false, reason: "Missing x-razorpay-signature header" };
    }

    const rawString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawString)
      .digest("hex");

    // Constant-time signature comparison (OWASP requirement)
    const isSignatureValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expectedSignature, "utf8"));

    if (!isSignatureValid) {
      return { isValid: false, reason: "Invalid signature" };
    }

    const body = JSON.parse(rawString);
    const eventId = headers["x-razorpay-event-id"] || body.event_id || crypto.randomUUID();
    const eventType = body.event;
    const paymentEntity = body.payload?.payment?.entity;

    const gatewayOrderId = paymentEntity?.order_id || null;
    const paymentId = paymentEntity?.id || null;
    const reportedAmount = paymentEntity?.amount ? paymentEntity.amount / 100 : null; // convert from paise
    const currency = paymentEntity?.currency || "INR";

    return {
      isValid: true,
      eventId,
      eventType,
      orderId: gatewayOrderId,
      paymentId,
      amount: reportedAmount,
      currency,
      rawEvent: body,
    };
  }

  async fetchPayment(paymentId) {
    return razorpayInstance.payments.fetch(paymentId);
  }

  async refund({ paymentId, amount, notes = {} }) {
    const options = {};
    if (amount) options.amount = Math.round(amount * 100);
    if (notes) options.notes = notes;
    return razorpayInstance.payments.refund(paymentId, options);
  }
}
