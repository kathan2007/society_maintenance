/**
 * PaymentGateway Base Interface (Adapter Pattern)
 * Defines standard contract for all payment providers: Razorpay, Stripe, UPI QR, etc.
 */
export default class PaymentGateway {
  constructor(name) {
    if (this.constructor === PaymentGateway) {
      throw new Error("PaymentGateway is an abstract class and cannot be instantiated directly.");
    }
    this.name = name;
  }

  /**
   * Create an order with the gateway
   * @param {Object} params - { amount, currency, receipt, notes, metadata }
   * @returns {Promise<{ orderId, gatewayOrderId, amount, currency, qrCodeUrl, clientSecret }>}
   */
  async createOrder(params) {
    throw new Error("Method 'createOrder' must be implemented.");
  }

  /**
   * Verify a webhook event signature and extract payload
   * @param {Buffer|string} rawBody - Raw unparsed webhook request body
   * @param {Object} headers - HTTP headers from the request
   * @returns {Promise<{ isValid, eventId, eventType, orderId, paymentId, amount, currency, rawEvent }>}
   */
  async verifyWebhook(rawBody, headers) {
    throw new Error("Method 'verifyWebhook' must be implemented.");
  }

  /**
   * Fetch payment details from gateway server-to-server
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async fetchPayment(paymentId) {
    throw new Error("Method 'fetchPayment' must be implemented.");
  }

  /**
   * Refund a payment
   * @param {Object} params - { paymentId, amount, reason }
   * @returns {Promise<Object>}
   */
  async refund(params) {
    throw new Error("Method 'refund' must be implemented.");
  }
}
