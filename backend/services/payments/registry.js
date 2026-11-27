import RazorpayGateway from "./razorpay.gateway.js";
import StripeGateway from "./stripe.gateway.js";
import UpiGateway from "./upi.gateway.js";

/**
 * Payment Gateway Registry
 * Instantiates gateways and checks them against the ENABLED_GATEWAYS allowlist
 */
class PaymentGatewayRegistry {
  constructor() {
    this.gateways = new Map();
    this.register(new RazorpayGateway());
    this.register(new StripeGateway());
    this.register(new UpiGateway());
  }

  register(gatewayInstance) {
    this.gateways.set(gatewayInstance.name.toLowerCase(), gatewayInstance);
  }

  getEnabledGateways() {
    const envList = process.env.ENABLED_GATEWAYS || "razorpay,stripe,upi";
    return envList
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter((g) => this.gateways.has(g));
  }

  getGateway(name) {
    const gatewayName = (name || process.env.PAYMENT_GATEWAY || "razorpay").toLowerCase();
    const enabled = this.getEnabledGateways();

    if (!enabled.includes(gatewayName)) {
      throw new Error(`Payment gateway '${gatewayName}' is not enabled or supported.`);
    }

    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      throw new Error(`Payment gateway '${gatewayName}' not found.`);
    }

    return gateway;
  }
}

const registry = new PaymentGatewayRegistry();
export default registry;
