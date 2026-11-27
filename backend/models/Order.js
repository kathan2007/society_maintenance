import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ["razorpay", "stripe", "upi", "other"],
      default: "razorpay",
    },
    gatewayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "expired"],
      default: "pending",
      index: true,
    },
    qrCodeUrl: {
      type: String,
    },
    qrId: {
      type: String,
    },
    maintenanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
