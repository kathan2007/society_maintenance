import Stripe from "stripe";
import PaymentGateway from "./PaymentGateway.js";
import crypto from "crypto";

/**
 * Stripe Payment Gateway Adapter
 */
export default class StripeGateway extends PaymentGateway {
  constructor() {
    super("stripe");
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: "2023-10-16" }) : null;
  }

  async createOrder({ amount, currency = "INR", receipt, metadata = {} }) {
    if (!this.stripe) {
      // Mock mode if Stripe key is not configured
      const mockId = `pi_mock_${crypto.randomBytes(8).toString("hex")}`;
      return {
        orderId: mockId,
        gatewayOrderId: mockId,
        amount,
        currency,
        clientSecret: `${mockId}_secret_mock`,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // smallest currency unit (cents/paise)
      currency: currency.toLowerCase(),
      description: receipt || `Maintenance payment`,
      metadata,
    });

    return {
      orderId: paymentIntent.id,
      gatewayOrderId: paymentIntent.id,
      amount,
      currency,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async verifyWebhook(rawBody, headers) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = headers["stripe-signature"];

    if (!webhookSecret || !this.stripe) {
      return { isValid: false, reason: "Stripe webhook secret not configured" };
    }

    if (!sig) {
      return { isValid: false, reason: "Missing stripe-signature header" };
    }

    let event;
    try {
      // built-in timestamp tolerance and signature verification
      event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      return { isValid: false, reason: err.message };
    }

    const eventId = event.id;
    const eventType = event.type;
    const dataObject = event.data?.object;

    const orderId = dataObject?.id || dataObject?.payment_intent;
    const paymentId = dataObject?.id;
    const reportedAmount = dataObject?.amount ? dataObject.amount / 100 : null;
    const currency = dataObject?.currency ? dataObject.currency.toUpperCase() : "INR";

    return {
      isValid: true,
      eventId,
      eventType,
      orderId,
      paymentId,
      amount: reportedAmount,
      currency,
      rawEvent: event,
    };
  }

  async fetchPayment(paymentId) {
    if (!this.stripe) return null;
    return this.stripe.paymentIntents.retrieve(paymentId);
  }

  async refund({ paymentId, amount, reason = "requested_by_customer" }) {
    if (!this.stripe) return null;
    const options = { payment_intent: paymentId, reason };
    if (amount) options.amount = Math.round(amount * 100);
    return this.stripe.refunds.create(options);
  }
}
