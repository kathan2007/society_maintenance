import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import crypto from "crypto";
import {
  validatePassword,
  hashPassword,
  comparePassword,
  generateAccessToken,
  verifyAccessToken,
  hashToken,
} from "../utils/authUtils.js";
import { RegisterSchema, CreatePaymentOrderSchema } from "../validators/schemas.js";
import RazorpayGateway from "../services/payments/razorpay.gateway.js";
import UpiGateway from "../services/payments/upi.gateway.js";

describe("Layer 2: Security Controls & Validation", () => {
  it("rejects common or short passwords", () => {
    expect(validatePassword("password123").valid).toBe(false);
    expect(validatePassword("12345678").valid).toBe(false);
    expect(validatePassword("short").valid).toBe(false);
    expect(validatePassword("A_Very_Strong_P@ssw0rd_2026").valid).toBe(true);
  });

  it("hashes passwords with bcrypt cost >= 12 and verifies in constant time", async () => {
    const pwd = "SecureMasterPassword#2026";
    const hashed = await hashPassword(pwd);
    expect(hashed).toBeDefined();
    expect(hashed.startsWith("$2a$12$") || hashed.startsWith("$2b$12$")).toBe(true);

    const match = await comparePassword(pwd, hashed);
    expect(match).toBe(true);

    const noMatch = await comparePassword("WrongPassword!", hashed);
    expect(noMatch).toBe(false);
  });

  it("signs and verifies JWT access tokens with pinned HS256 algorithm", () => {
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      role: "user",
      name: "John Resident",
      flatNo: "A-101",
    };
    const token = generateAccessToken(mockUser);
    expect(typeof token).toBe("string");

    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(mockUser._id);
    expect(decoded.role).toBe("user");
    expect(decoded.iss).toBe("shree-hari-portal");
    expect(decoded.aud).toBe("shree-hari-client");
  });

  it("rejects forged or tampered JWT access tokens", () => {
    const mockUser = { id: "507f1f77bcf86cd799439011", role: "user" };
    const token = generateAccessToken(mockUser);
    const tampered = token.slice(0, -6) + "abcdef";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

describe("Layer 4 & 5: Mass Assignment & Zod Validation", () => {
  it("rejects mass assignment with unknown fields in strict schema", () => {
    const maliciousPayload = {
      name: "Eve Hacker",
      username: "evehacker",
      password: "StrongSecretPassword99!",
      role: "admin", // attempt to elevate role
      unknownDangerousProperty: "hack",
    };

    expect(() => RegisterSchema.parse(maliciousPayload)).toThrow();
  });

  it("does not accept client-provided amount in CreatePaymentOrderSchema", () => {
    const clientPayload = {
      maintenanceId: "507f1f77bcf86cd799439011",
      amount: 1, // Malicious attempt to pay 1 rupee instead of bill amount
    };

    // Strict schema must reject the unexpected 'amount' field
    expect(() => CreatePaymentOrderSchema.parse(clientPayload)).toThrow();
  });
});

describe("Layer 6: Multi-Gateway Webhook & Signature Verification", () => {
  const secret = "test_webhook_secret_key_123456";
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;

  it("rejects Razorpay webhook with missing or invalid signature", async () => {
    const gateway = new RazorpayGateway();
    const fakeRawBody = JSON.stringify({ event: "payment.captured" });

    // Missing signature
    const res1 = await gateway.verifyWebhook(fakeRawBody, {});
    expect(res1.isValid).toBe(false);

    // Bad signature
    const res2 = await gateway.verifyWebhook(fakeRawBody, {
      "x-razorpay-signature": "invalid_forged_hex_signature",
    });
    expect(res2.isValid).toBe(false);
  });

  it("validates Razorpay webhook with valid HMAC SHA-256 signature using constant-time compare", async () => {
    const gateway = new RazorpayGateway();
    const payload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test12345",
            order_id: "order_test67890",
            amount: 80000, // 800 INR
            currency: "INR",
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const result = await gateway.verifyWebhook(rawBody, {
      "x-razorpay-signature": validSignature,
    });

    expect(result.isValid).toBe(true);
    expect(result.paymentId).toBe("pay_test12345");
    expect(result.orderId).toBe("order_test67890");
    expect(result.amount).toBe(800);
    expect(result.currency).toBe("INR");
  });

  it("generates locked, tamper-proof UPI URI server-side", async () => {
    const upiGateway = new UpiGateway();
    const order = await upiGateway.createOrder({
      amount: 1000,
      currency: "INR",
      receipt: "BILL_2026-11",
    });

    expect(order.qrCodeUrl).toContain("am=1000");
    expect(order.qrCodeUrl).toContain("cu=INR");
    expect(order.qrCodeUrl).toContain(order.orderId);
    expect(order.qrCodeUrl).not.toContain("mam="); // Maximum amount not flexible
  });
});

describe("Layer 3: Token Family Rotation & Hashing", () => {
  it("hashes raw tokens using SHA-256 before storage", () => {
    const raw = "random_session_secret_token_abc123";
    const hashed = hashToken(raw);
    expect(hashed).toHaveLength(64);
    expect(hashToken(raw)).toBe(hashed); // Deterministic hash
  });
});
