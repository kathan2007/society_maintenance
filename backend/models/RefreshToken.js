import mongoose from "mongoose";

/**
 * RefreshToken Schema
 * Implements token rotation + reuse detection:
 * - Each token belongs to a token family
 * - If a revoked token is used, the whole family is revoked (reuse attack detection)
 * - Auto-expires using Mongo TTL index
 */
const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "7d" }, // Mongo TTL index
    },
    userAgent: {
      type: String,
      default: "unknown",
    },
    ip: {
      type: String,
      default: "unknown",
    },
  },
  { timestamps: true }
);

export default mongoose.model("RefreshToken", RefreshTokenSchema);
