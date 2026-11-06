import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "expired"],
      default: "pending",
    },
    paymentId: {
      type: String,
      default: null,
    },
    qrCodeUrl: {
      type: String, // String representation of the UPI intent and/or QR image URL
    },
    qrId: {
      type: String, // Razorpay QR ID
    },
    maintenanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
    },
    expiresAt: {
      type: Date,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
