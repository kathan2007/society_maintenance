import mongoose from "mongoose";

/**
 * User Schema - Hardened with security controls:
 * - password has `select: false` so it is never accidentally returned in queries
 * - failedLoginAttempts & lockUntil for brute-force protection
 * - twoFactorSecret & backupCodes for Admin TOTP 2FA
 * - refreshTokenVersion for session invalidation
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
    },

    category: {
      type: String,
      enum: ["owner", "rent"],
      required: true,
      default: "owner",
    },

    vehicleCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    vehicleNumbers: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    password: {
      type: String,
      required: true,
      select: false, // Security: never returned by default in queries
    },

    flatNo: {
      type: String,
      default: "OFFICE",
      trim: true,
      maxlength: 20,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Brute-force lockout
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },

    // 2FA TOTP (Mandatory for Admin in prod)
    twoFactorSecret: {
      type: String,
      select: false,
      default: null,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false,
      default: [],
    },

    // Session invalidation version
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Method to check if account is locked
UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

export default mongoose.model("User", UserSchema);
