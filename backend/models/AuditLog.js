import mongoose from "mongoose";

/**
 * AuditLog Schema (Append-only)
 * Records all critical actions, logins, status modifications, payment events, and admin operations.
 */
const AuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    role: {
      type: String,
      default: "system",
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: "unknown",
    },
    userAgent: {
      type: String,
      default: "unknown",
    },
    requestId: {
      type: String,
      default: null,
    },
    at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Method to quickly create audit records
export const logAudit = async (logData) => {
  try {
    const AuditLog = mongoose.model("AuditLog");
    await AuditLog.create(logData);
  } catch (err) {
    console.error("Audit log creation error:", err.message);
  }
};

export default mongoose.model("AuditLog", AuditLogSchema);
