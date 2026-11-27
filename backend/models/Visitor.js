import mongoose from "mongoose";

/**
 * Visitor Schema
 * Implements DPDP Act data minimization & retention policy:
 * Logs auto-expire after 180 days via MongoDB TTL index on createdAt
 */
const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },

    expectedDate: {
      type: Date,
      required: true,
    },

    purpose: {
      type: String,
      default: "General Visit",
      trim: true,
      maxlength: 200,
    },

    status: {
      type: String,
      enum: ["Expected", "Entered", "Exited"],
      default: "Expected",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 15552000, // 180 days TTL retention policy
    },
  },
  { timestamps: true }
);

export default mongoose.model("Visitor", visitorSchema);
