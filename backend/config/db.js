import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/societyDB";
    await mongoose.connect(uri);
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
