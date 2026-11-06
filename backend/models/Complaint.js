import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
{
  message: {
    type: String,
    required: true
  },

  category: {
    type: String,
    default: "General"
  },

  status: {
    type: String,
    enum: ["Pending","In Progress","Resolved"],
    default: "Pending"
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{ timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);