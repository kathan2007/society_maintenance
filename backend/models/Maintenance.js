import mongoose from "mongoose";

/**
 * Maintenance Schema
 * Each maintenance entry is linked to a user (userId)
 * status defaults to "Pending"
 */

const MaintenanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Prevent negative amounts
    },
    month: {
      type: String,
      required: true, // e.g., "March 2026"
      trim: true,
    },
    status: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Pending",
    },
    transactionId: {
      type: String,
      default: null,
      trim: true,
    },
    penalty: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Maintenance", MaintenanceSchema);