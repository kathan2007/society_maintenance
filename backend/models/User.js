import mongoose from "mongoose";

/**
 * User Schema
 * Stores resident and admin user information
 */

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      enum: ["owner", "rent"],
      required: true,
      default: "owner"
    },

    vehicleCount: {
      type: Number,
      default: 0
    },

    vehicleNumbers: {
      type: String,
      trim: true
    },

    password: {
      type: String,
      required: true,
    },

    flatNo: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
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
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);