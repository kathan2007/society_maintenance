import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import http from "http";
import { Server } from "socket.io";

// Config & Utils
import connectDB from "./config/db.js";
import socketManager from "./utils/socketManager.js";

// Models
import User from "./models/User.js";
import Settings from "./models/Settings.js";
import Maintenance from "./models/Maintenance.js";
import Complaint from "./models/Complaint.js";
import Notice from "./models/Notice.js";
import Expense from "./models/Expense.js";
import Visitor from "./models/Visitor.js";

// Middleware
import verifyToken from "./middleware/auth.js";

// Routes
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck endpoint for Docker & CI/CD
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Initialize Socket Manager
socketManager.setIO(io);

// Socket.io Connection Logic
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
  socket.on("join", (orderId) => {
    socket.join(orderId);
    console.log(`User joined dynamic order room: ${orderId}`);
  });
  socket.on("disconnect", () => console.log("Disconnected"));
});

// Connect to Database
connectDB();

// ===== Existing Routes (simplified for modular focus) =====
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// (Keep existing endpoints for backward compatibility or refactor further)
// I will keep the main logic from the previous server.js version to ensure the app still works

app.post("/register", async (req,res)=>{
  try {
    const {name,username,category,vehicleCount,vehicleNumbers,password,flatNo,phoneNumber,role} = req.body;
    if(await User.findOne({username})) return res.status(400).json({message:"Username already exists"});
    const hashed = await bcrypt.hash(password,10);
    const user = new User({name,username,category: category || "owner",vehicleCount: vehicleCount || 0,vehicleNumbers,password:hashed,flatNo,phoneNumber,role: role || "user"});
    await user.save();
    res.json({success:true,message:"Registration successful"});
  } catch(err) { res.status(500).json({message:err.message}) }
});

app.post("/login", async (req,res)=>{
  try{
    const {username,password} = req.body;
    const user = await User.findOne({username: username.toLowerCase().trim()});
    if(!user) return res.status(404).json({message:"User not found"});
    if(!await bcrypt.compare(password,user.password)) return res.status(401).json({message:"Invalid password"});

    const token = jwt.sign({id:user._id, role:user.role}, JWT_SECRET, {expiresIn:"1d"});
    res.json({success:true, token, role:user.role, name:user.name, userId:user._id, category:user.category || 'owner'});
  }catch(err){ res.status(500).json({message:"Login error"}); }
});

app.get("/settings", verifyToken, async (req, res) => {
  try {
    let settings = await Settings.findOne() || await Settings.create({ ownerMaintenanceAmount: 800, rentMaintenanceAmount: 1000, penaltyAmount: 100 });
    res.json(settings);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.put("/settings", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (err) { res.status(500).json({ message: "Error updating settings" }); }
});

app.get("/maintenance", verifyToken, async(req,res)=>{
  const isAll = req.query.all === "true";
  const filter = (req.user.role === "admin" || isAll) ? {} : { userId: req.user.id };
  
  console.log(`FETCH MAINTENANCE: User=${req.user.id}, Role=${req.user.role}, Filter=${JSON.stringify(filter)}`);
  
  const fetchedData = await Maintenance.find(filter).populate("userId", "name flatNo phoneNumber category");
  
  const dataSettings = await Settings.findOne() || { penaltyAmount: 100 };
  const data = fetchedData.map(record => {
    let penalty = 0;
    if (record.status === "Pending") {
      const monthStart = new Date(record.month + " 1"); 
      if (!isNaN(monthStart.getTime())) {
        const dueDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 15);
        if (new Date() > dueDate) penalty = dataSettings.penaltyAmount;
      }
    } else { penalty = record.penalty || 0; }
    const obj = record.toObject();
    obj.penalty = penalty;
    obj.totalAmount = (record.amount || 0) + penalty;
    return obj;
  });
  res.json(data);
});

app.post("/maintenance", verifyToken, async (req, res) => {
  try {
    const { month } = req.body;
    const settings = await Settings.findOne() || { ownerMaintenanceAmount: 800, rentMaintenanceAmount: 1000 };
    const users = await User.find({ role: "user" });
    
    let count = 0;
    for (const user of users) {
      const existing = await Maintenance.findOne({ userId: user._id, month });
      if (!existing) {
        const amount = user.category === "rent" ? settings.rentMaintenanceAmount : settings.ownerMaintenanceAmount;
        await new Maintenance({ userId: user._id, amount, month, status: "Pending" }).save();
        count++;
      }
    }
    res.json({ success: true, message: `Generated ${count} bills for ${month}` });
  } catch (err) { res.status(500).json({ message: "Error generating bills" }); }
});

app.post("/maintenance/user", verifyToken, async (req, res) => {
  try {
    const { amount, month, transactionId, penalty, status } = req.body;
    const maintenance = new Maintenance({
      userId: req.user.id,
      amount,
      month,
      transactionId: transactionId || "PENDING",
      penalty: penalty || 0,
      status: status || "Pending"
    });
    await maintenance.save();
    res.json(maintenance);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.put("/maintenance/:id", verifyToken, async (req, res) => {
  try {
    console.log(`UPDATE MAINTENANCE: ID=${req.params.id}, Body=${JSON.stringify(req.body)}`);
    const maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("userId", "name flatNo phoneNumber category");
    if (!maintenance) return res.status(404).json({ message: "Record not found" });
    res.json(maintenance);
  } catch (err) { 
    console.error("Update Error:", err);
    res.status(500).json({ message: "Error" }); 
  }
});

// ===== Complaints =====
app.post("/complaint", verifyToken, async (req, res) => {
  try {
    const complaint = new Complaint({ ...req.body, userId: req.user.id });
    await complaint.save();
    res.json(complaint);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.get("/complaint", verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user.id };
    const complaints = await Complaint.find(filter).populate("userId", "name flatNo").sort("-createdAt");
    res.json(complaints);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.put("/complaint/:id", verifyToken, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(complaint);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

// ===== Notices =====
app.get("/notice", async (req, res) => {
  try {
    const notices = await Notice.find().sort("-createdAt");
    res.json(notices);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/notice", verifyToken, async (req, res) => {
  try {
    const notice = new Notice({ ...req.body, postedBy: req.user.id });
    await notice.save();
    res.json(notice);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.delete("/notice/:id", verifyToken, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

// ===== Expenses =====
app.get("/expense", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find().sort("-date");
    res.json(expenses);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/expense", verifyToken, async (req, res) => {
  try {
    const expense = new Expense({ ...req.body, addedBy: req.user.id });
    await expense.save();
    res.json(expense);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.delete("/expense/:id", verifyToken, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

// ===== Visitors =====
app.get("/visitor", verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user.id };
    const visitors = await Visitor.find(filter).populate("userId", "name flatNo").sort("-createdAt");
    res.json(visitors);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/visitor", verifyToken, async (req, res) => {
  try {
    const visitor = new Visitor({ ...req.body, userId: req.user.id });
    await visitor.save();
    res.json(visitor);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.put("/visitor/:id", verifyToken, async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(visitor);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

// ===== Admin User Access =====
app.get("/admin/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

// Modular Routes Integration
app.use("/api/payment", paymentRoutes);

// Automated Monthly Cron
cron.schedule("0 0 1 * *", async () => {
    try {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const s = await Settings.findOne() || { ownerMaintenanceAmount: 800, rentMaintenanceAmount: 1000 };
        const users = await User.find({ role: "user" });
        for (const user of users) {
          if (!await Maintenance.findOne({ userId: user._id, month: monthStr })) {
            await new Maintenance({ userId: user._id, amount: user.category === "rent" ? s.rentMaintenanceAmount : s.ownerMaintenanceAmount, month: monthStr, status: "Pending" }).save();
          }
        }
    } catch (err) { console.error("Cron error", err); }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Gateway Online: http://localhost:${PORT}`));
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} already in use. Run: npm run dev (it kills port automatically)\n`);
    process.exit(1);
  }
});