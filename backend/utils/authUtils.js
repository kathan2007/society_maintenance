import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { createRequire } from "module";
import RefreshToken from "../models/RefreshToken.js";
import User from "../models/User.js";

const require = createRequire(import.meta.url);
const otplib = require("otplib");

// Common passwords blocklist (OWASP ASVS requirement)
const COMMON_PASSWORDS = new Set([
  "password", "password123", "12345678", "123456789", "1234567890",
  "admin123", "qwerty123", "letmein123", "welcome123", "passcode123",
  "iloveyou1", "secret123", "changeme1", "superman1", "trustno1",
  "shreehari", "giftcity1", "society123"
]);

const JWT_ISSUER = "shree-hari-portal";
const JWT_AUDIENCE = "shree-hari-client";
const BCRYPT_ROUNDS = 12;

export const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "default_fallback_access_secret_64_bytes_minimum_length_for_hmac_sha256_security";
export const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || "default_fallback_refresh_secret_64_bytes_minimum_length_for_hmac_sha256_security";

/**
 * Validate password complexity & blocklist
 */
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < 10) {
    return { valid: false, message: "Password must be at least 10 characters long" };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, message: "Password is too common and easily guessable" };
  }
  return { valid: true };
}

/**
 * Hash password with bcrypt cost >= 12
 */
export async function hashPassword(plainText) {
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

/**
 * Constant-time compare password
 */
export async function comparePassword(plainText, hash) {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate Access Token (15 min expiry)
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      role: user.role,
      name: user.name,
      flatNo: user.flatNo,
    },
    getAccessSecret(),
    {
      algorithm: "HS256",
      expiresIn: process.env.ACCESS_TTL || "15m",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret(), {
    algorithms: ["HS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

/**
 * SHA-256 hash a refresh token for storage
 */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Create and persist a Refresh Token with family tracking
 */
export async function createRefreshToken(user, userAgent = "unknown", ip = "unknown", existingFamily = null) {
  const family = existingFamily || crypto.randomUUID();
  const rawToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({
    userId: user._id || user.id,
    tokenHash,
    family,
    expiresAt,
    userAgent,
    ip,
  });

  return { rawToken, expiresAt, family };
}

/**
 * Rotate Refresh Token with Reuse Detection
 * If a token from a revoked family or an already-replaced token is submitted,
 * revoke ALL tokens in that family immediately (mitigate stolen refresh token replay).
 */
export async function rotateRefreshToken(rawToken, userAgent = "unknown", ip = "unknown") {
  const tokenHash = hashToken(rawToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    throw new Error("Invalid refresh token");
  }

  // REUSE DETECTION: If token was already revoked, revoke the whole family!
  if (tokenDoc.revoked) {
    await RefreshToken.updateMany({ family: tokenDoc.family }, { revoked: true });
    // Invalidate user session version
    await User.findByIdAndUpdate(tokenDoc.userId, { $inc: { refreshTokenVersion: 1 } });
    throw new Error("Refresh token reuse detected. All sessions revoked.");
  }

  // Token is valid; revoke it and issue replacement in same family
  tokenDoc.revoked = true;
  const newRawToken = crypto.randomBytes(40).toString("hex");
  const newTokenHash = hashToken(newRawToken);
  tokenDoc.replacedByTokenHash = newTokenHash;
  await tokenDoc.save();

  const user = await User.findById(tokenDoc.userId);
  if (!user || !user.isActive) {
    throw new Error("User account is inactive or not found");
  }

  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: newTokenHash,
    family: tokenDoc.family,
    expiresAt: newExpiresAt,
    userAgent,
    ip,
  });

  const newAccessToken = generateAccessToken(user);

  return {
    accessToken: newAccessToken,
    refreshToken: newRawToken,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      flatNo: user.flatNo,
      category: user.category,
    },
  };
}

/**
 * Revoke specific refresh token (Logout)
 */
export async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
}

/**
 * Revoke all refresh tokens for a user (Logout all devices)
 */
export async function revokeAllUserTokens(userId) {
  await RefreshToken.updateMany({ userId }, { revoked: true });
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
}

/**
 * TOTP 2FA Helpers
 */
export function generateTotpSecret(username) {
  const secret = otplib.generateSecret();
  const otpauth = otplib.generateURI({
    issuer: "ShreeHariGiftCity",
    label: username,
    secret,
  });
  return { secret, otpauth };
}

export function verifyTotpToken(token, secret) {
  try {
    const result = otplib.verifySync({ token, secret });
    return !!result.valid;
  } catch {
    return false;
  }
}
