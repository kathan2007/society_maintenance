import mongoose from "mongoose";

/**
 * Notice Schema
 * Each notice is linked to the admin who posted it (postedBy)
 * Optional expiryDate allows automatic deletion via TTL index
 */

const NoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["General", "Emergency", "Event", "Maintenance"],
      default: "General",
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiryDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: Mongo will automatically delete expired notices
NoticeSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Notice", NoticeSchema);