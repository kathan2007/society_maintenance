import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  expectedDate: {
    type: Date,
    required: true
  },

  purpose: {
    type: String,
    default: "General Visit"
  },

  status: {
    type: String,
    enum: ["Expected", "Entered", "Exited"],
    default: "Expected"
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{ timestamps: true }
);

export default mongoose.model("Visitor", visitorSchema);
