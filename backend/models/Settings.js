import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    ownerMaintenanceAmount: {
      type: Number,
      required: true,
      default: 800,
    },
    rentMaintenanceAmount: {
      type: Number,
      required: true,
      default: 1000,
    },
    penaltyAmount: {
      type: Number,
      required: true,
      default: 100,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);
