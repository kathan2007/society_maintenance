import mongoose from "mongoose";

/**
 * ProcessedEvent Schema
 * Tracks webhook event IDs to prevent webhook replay attacks and guarantee idempotency.
 * Auto-expires via TTL index after 7 days.
 */
const ProcessedEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gateway: {
      type: String,
      required: true,
      enum: ["razorpay", "stripe", "upi", "other"],
    },
    eventType: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "7d", // Mongo TTL index
    },
  },
  { timestamps: false }
);

export default mongoose.model("ProcessedEvent", ProcessedEventSchema);
