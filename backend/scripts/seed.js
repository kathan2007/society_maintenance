// =====================================================================
// Seed Script — Shree Hari Gift City Portal
// Usage: NODE_ENV=development node backend/scripts/seed.js
// SAFETY: Refuses to run in production
// =====================================================================

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config({ path: "../.env" });

if (process.env.NODE_ENV === "production") {
  console.error("❌ Seed script cannot run in production.");
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/societyDB";

// ── Minimal inline schemas (avoids circular imports) ──
const userSchema = new mongoose.Schema({
  name: String, username: String, password: String,
  flatNo: { type: String, default: "OFFICE" },
  phoneNumber: String, role: String, category: String,
  vehicleCount: Number, vehicleNumbers: [String],
}, { timestamps: true });

const maintenanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number, penalty: { type: Number, default: 0 },
  totalAmount: Number, month: String,
  status: { type: String, default: "Pending" },
}, { timestamps: true });

const noticeSchema = new mongoose.Schema({
  title: String, content: String, priority: String, postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
  category: String, description: String, amount: Number, date: Date, addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Maintenance = mongoose.model("Maintenance", maintenanceSchema);
const Notice = mongoose.model("Notice", noticeSchema);
const Expense = mongoose.model("Expense", expenseSchema);

const flats = [
  { flatNo: "A-101", category: "owner" }, { flatNo: "A-102", category: "rent" },
  { flatNo: "A-103", category: "owner" }, { flatNo: "B-101", category: "rent" },
  { flatNo: "B-102", category: "owner" }, { flatNo: "B-201", category: "owner" },
  { flatNo: "C-101", category: "rent" }, { flatNo: "C-201", category: "owner" },
  { flatNo: "D-101", category: "owner" }, { flatNo: "D-201", category: "rent" },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI);

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Maintenance.deleteMany({}),
    Notice.deleteMany({}),
    Expense.deleteMany({}),
  ]);
  console.log("🗑  Cleared existing seed data");

  // Admin
  const adminPwd = await bcrypt.hash("admin", 10);
  const admin = await User.create({
    name: "Society Administrator", username: "admin", password: adminPwd,
    flatNo: "OFFICE", phoneNumber: "9999999999", role: "admin", category: "owner", vehicleCount: 0,
  });
  console.log("👑 Admin created: admin / admin");

  // Residents
  const residents = [];
  for (const flat of flats) {
    const username = `resident_${flat.flatNo.toLowerCase().replace("-", "")}`;
    const pwd = await bcrypt.hash("password123", 10);
    const r = await User.create({
      name: `Resident ${flat.flatNo}`, username, password: pwd,
      flatNo: flat.flatNo, phoneNumber: `98${Math.floor(Math.random() * 1e8).toString().padStart(8, "0")}`,
      role: "user", category: flat.category, vehicleCount: 1, vehicleNumbers: [`GJ01XX${Math.floor(Math.random() * 9000) + 1000}`],
    });
    residents.push(r);
  }
  console.log(`🏠 Created ${residents.length} residents`);

  // Maintenance bills for last 3 months
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  for (const r of residents) {
    for (const month of months) {
      const amount = r.category === "rent" ? 1000 : 800;
      const paid = Math.random() > 0.4;
      await Maintenance.create({
        userId: r._id, amount, penalty: 0, totalAmount: amount, month,
        status: paid ? "Paid" : "Pending",
        ...(paid ? { paidAt: new Date(), transactionId: `TXN${Date.now()}` } : {}),
      });
    }
  }
  console.log("💰 Maintenance bills created");

  // Notices
  await Notice.create([
    { title: "Annual General Meeting", content: "AGM scheduled for the 25th of this month at 6PM in the community hall.", priority: "high", postedBy: admin._id },
    { title: "Water Supply Maintenance", content: "Water supply will be disrupted on Sunday 10AM–2PM for pipeline maintenance.", priority: "medium", postedBy: admin._id },
    { title: "Diwali Celebration", content: "Society Diwali celebration on the 1st. All residents are welcome!", priority: "low", postedBy: admin._id },
  ]);
  console.log("📋 Notices created");

  // Expenses
  await Expense.create([
    { category: "Security", description: "Guard salary - October", amount: 15000, date: new Date(), addedBy: admin._id },
    { category: "Maintenance", description: "Elevator AMC", amount: 8000, date: new Date(), addedBy: admin._id },
    { category: "Utilities", description: "Common area electricity", amount: 3500, date: new Date(), addedBy: admin._id },
    { category: "Cleaning", description: "Housekeeping services", amount: 6000, date: new Date(), addedBy: admin._id },
  ]);
  console.log("💸 Expenses created");

  await mongoose.disconnect();
  console.log("\n✅ Seed complete! Login: admin / admin (or resident_a101 / password123)");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
