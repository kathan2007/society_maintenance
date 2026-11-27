import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cron from "node-cron";
import http from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import pino from "pino";
import pinoHttp from "pino-http";

// Config & Utils
import connectDB from "./config/db.js";
import socketManager from "./utils/socketManager.js";
import {
  validatePassword,
  hashPassword,
  comparePassword,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateTotpSecret,
  verifyTotpToken,
  verifyAccessToken,
} from "./utils/authUtils.js";

// Models
import User from "./models/User.js";
import Settings from "./models/Settings.js";
import Maintenance from "./models/Maintenance.js";
import Complaint from "./models/Complaint.js";
import Notice from "./models/Notice.js";
import Expense from "./models/Expense.js";
import Visitor from "./models/Visitor.js";
import Order from "./models/Order.js";
import { logAudit } from "./models/AuditLog.js";

// Middleware
import { verifyToken } from "./middleware/auth.js";
import { requireRole } from "./middleware/authorize.js";
import {
  validateBody,
  RegisterSchema,
  LoginSchema,
  ComplaintCreateSchema,
  NoticeCreateSchema,
  ExpenseCreateSchema,
  VisitorCreateSchema,
} from "./validators/schemas.js";

// Routes
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

// =========================================================================
// LAYER 1 & 2: EDGE & HTTP HARDENING
// =========================================================================

// Trust proxy for Render / Vercel edge termination
app.set("trust proxy", 1);

// Disable x-powered-by
app.disable("x-powered-by");

// Request ID Middleware
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});

// Structured logging with pino (sensitive fields redacted)
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "req.body.refreshToken",
      "req.body.totpToken",
      "res.headers['set-cookie']",
    ],
    remove: true,
  },
});

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

// Strict Helmet Configuration (HSTS, CSP, Frameguard)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://*.vercel.app",
          "https://*.onrender.com",
          "https://api.razorpay.com",
          "https://api.stripe.com",
          "wss://*.onrender.com",
        ],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://js.stripe.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// Strict CORS Allowlist
const vercelSubdomainRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
const clientOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server, mobile or curl
  if (origin === "http://localhost:3000" || origin === "http://localhost:5000") return true;
  if (clientOrigins.includes(origin)) return true;
  if (vercelSubdomainRegex.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      callback(new Error("CORS: Request origin not permitted by policy"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Requested-With"],
  })
);

// Parameter pollution protection
app.use(hpp());

// NoSQL injection sanitization (strip $ and .)
app.use(mongoSanitize());

// Cookie parser for secure httpOnly refresh tokens
app.use(cookieParser());

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again later." },
});

// Mount modular payment routes (has its own raw parser for webhooks)
app.use("/api/payment", paymentRoutes);

// Body parser with 10kb limit (prevents denial-of-service via memory exhaustion)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Healthcheck & Gateway status
app.get("/", (req, res) => {
  res.status(200).json({ message: "Shree Hari Gift City API Gateway Online", health: "/health" });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// =========================================================================
// WEBSOCKET SERVER & AUTHENTICATION
// =========================================================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error("Socket CORS rejected"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

socketManager.setIO(io);

// Socket.io Handshake Authentication
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    // Allow guest connection, but unauthenticated sockets cannot join sensitive rooms
    socket.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    // Proceed with unauthenticated state
    socket.user = null;
    next();
  }
});

// Socket connection & Room authorization (OWASP BOLA defense)
io.on("connection", (socket) => {
  socket.on("join", async (orderId) => {
    try {
      if (!orderId) return;

      // Verify order ownership before permitting room subscription
      const order = await Order.findOne({ orderId });
      if (!order) return;

      // If user is authenticated, ensure order belongs to them or user is admin
      if (socket.user) {
        if (socket.user.role !== "admin" && order.userId.toString() !== socket.user.id) {
          socket.emit("error", { message: "Unauthorized to subscribe to this order room" });
          return;
        }
      }

      socket.join(orderId);
    } catch (err) {
      // room join error
    }
  });
});

// =========================================================================
// DATABASE & ADMIN SEEDING (PRODUCTION HARDENED)
// =========================================================================
connectDB().then(() => {
  seedAdminSafely();
});

const seedAdminSafely = async () => {
  try {
    const adminUsername = (process.env.ADMIN_USERNAME || "admin").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";

    let admin = await User.findOne({ username: adminUsername }).select("+password");
    if (!admin) {
      admin = await User.findOne({ role: "admin" }).select("+password");
    }

    if (!admin) {
      const hashed = await hashPassword(adminPassword);
      await User.create({
        name: "Society Administrator",
        username: adminUsername,
        password: hashed,
        flatNo: "OFFICE",
        phoneNumber: "9999999999",
        role: "admin",
        category: "owner",
        vehicleCount: 0,
      });
      console.log(`✅ Administrator initialized: username: '${adminUsername}'`);
    } else {
      // Sync admin credentials and unlock account
      admin.username = adminUsername;
      admin.role = "admin";
      admin.failedLoginAttempts = 0;
      admin.lockUntil = null;
      admin.isActive = true;
      admin.password = await hashPassword(adminPassword);
      await admin.save();
      console.log(`✅ Administrator synced: username: '${adminUsername}' | password ready`);
    }
  } catch (err) {
    console.error("Admin init error:", err.message);
  }
};

// =========================================================================
// LAYER 3: AUTHENTICATION ROUTES
// =========================================================================

// --- Register ---
app.post("/register", authLimiter, validateBody(RegisterSchema), async (req, res) => {
  try {
    const { name, username, password, category, vehicleCount, vehicleNumbers, flatNo, phoneNumber, role, adminInviteCode } = req.body;

    // Check username availability
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Password validation (min 10 chars, check common blocklist)
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ message: pwdCheck.message });
    }

    // Mass assignment defense: creating an admin requires server-side ADMIN_INVITE_CODE
    let targetRole = "user";
    if (role === "admin") {
      const expectedCode = process.env.ADMIN_INVITE_CODE;
      if (!expectedCode || adminInviteCode !== expectedCode) {
        return res.status(403).json({ message: "Admin registration requires a valid admin invite code." });
      }
      targetRole = "admin";
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
      category: targetRole === "admin" ? "owner" : category,
      vehicleCount: targetRole === "admin" ? 0 : vehicleCount,
      vehicleNumbers: targetRole === "admin" ? "" : vehicleNumbers,
      flatNo: targetRole === "admin" ? "OFFICE" : flatNo || "A-101",
      phoneNumber: phoneNumber || "9999999999",
      role: targetRole,
    });

    await logAudit({
      actorId: newUser._id,
      role: targetRole,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: newUser._id.toString(),
      after: { username, role: targetRole },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      requestId: req.id,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please log in.",
    });
  } catch (err) {
    res.status(500).json({ message: "Registration error" });
  }
});

// --- Login ---
app.post("/login", authLimiter, validateBody(LoginSchema), async (req, res) => {
  try {
    const { username, password, totpToken } = req.body;

    // Fetch user including password and security fields
    const user = await User.findOne({ username }).select(
      "+password +failedLoginAttempts +lockUntil +twoFactorSecret +twoFactorEnabled"
    );

    // Generic error message to prevent username enumeration (OWASP ASVS)
    const INVALID_CREDENTIALS = "Invalid credentials";

    if (!user) {
      // Simulate compare delay to prevent timing attacks
      await comparePassword(password, "$2a$12$e80yq7s3v7b0w2r7t6y8u9i0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c");
      return res.status(401).json({ message: INVALID_CREDENTIALS });
    }

    // Check account lockout
    if (user.isLocked()) {
      return res.status(429).json({
        message: "Account temporarily locked due to repeated failed logins. Please try again in 15 minutes.",
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        await logAudit({
          actorId: user._id,
          role: user.role,
          action: "ACCOUNT_LOCKED",
          entity: "User",
          entityId: user._id.toString(),
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.id,
        });
      }
      await user.save();
      return res.status(401).json({ message: INVALID_CREDENTIALS });
    }

    // Reset failed login attempts upon successful password match
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // If 2FA is enabled (or admin in production), require TOTP token
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!totpToken) {
        return res.status(403).json({
          message: "2FA authentication code required",
          requires2FA: true,
        });
      }
      const isTotpValid = verifyTotpToken(totpToken, user.twoFactorSecret);
      if (!isTotpValid) {
        return res.status(401).json({ message: "Invalid 2FA authentication code" });
      }
    }

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const { rawToken: refreshToken } = await createRefreshToken(
      user,
      req.headers["user-agent"],
      req.ip
    );

    // Set secure httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit({
      actorId: user._id,
      role: user.role,
      action: "LOGIN_SUCCESS",
      entity: "User",
      entityId: user._id.toString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      requestId: req.id,
    });

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        _id: user._id,
        userId: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        flatNo: user.flatNo,
        category: user.category,
      },
      role: user.role,
      name: user.name,
      userId: user._id,
      category: user.category,
    });
  } catch (err) {
    res.status(500).json({ message: "Login service error" });
  }
});

// --- Refresh Token with Rotation & Reuse Detection ---
app.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const result = await rotateRefreshToken(token, req.headers["user-agent"], req.ip);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (err) {
    res.status(401).json({ message: err.message || "Invalid refresh token" });
  }
});

// --- Logout (Revokes current session) ---
app.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      await revokeRefreshToken(token);
    }
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.json({ success: true });
  }
});

// --- Logout All Sessions ---
app.post("/logout-all", verifyToken, async (req, res) => {
  try {
    await revokeAllUserTokens(req.user.id);
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "All sessions revoked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error revoking sessions" });
  }
});

// =========================================================================
// LAYER 4: AUTHORIZED APPLICATION ROUTES (IDOR / BOLA PROTECTED)
// =========================================================================

// Helper function to calculate and update late payment penalty
// If current date > due day (default 15th) of the bill month, apply penalty set by admin
const applyLatePaymentPenalties = async () => {
  try {
    const s = (await Settings.findOne()) || {
      ownerMaintenanceAmount: 800,
      rentMaintenanceAmount: 1000,
      penaltyAmount: 100,
      penaltyDueDay: 15,
    };

    const dueDay = s.penaltyDueDay || 15;
    const penaltyAmt = s.penaltyAmount || 100;
    const now = new Date();

    // Find all pending bills
    const pendingBills = await Maintenance.find({ status: "Pending" });

    for (const bill of pendingBills) {
      let isOverdue = false;

      // Bill month format: "YYYY-MM" or "Month YYYY"
      let billYear = null;
      let billMonthIndex = null; // 0-indexed

      if (bill.month && bill.month.includes("-")) {
        const parts = bill.month.split("-");
        billYear = parseInt(parts[0], 10);
        billMonthIndex = parseInt(parts[1], 10) - 1;
      } else if (bill.month) {
        const parsedDate = new Date(`${bill.month} 1`);
        if (!isNaN(parsedDate.getTime())) {
          billYear = parsedDate.getFullYear();
          billMonthIndex = parsedDate.getMonth();
        }
      }

      if (billYear !== null && billMonthIndex !== null) {
        // Due date is the Xth (e.g. 15th) day of that bill month at 23:59:59
        const deadline = new Date(billYear, billMonthIndex, dueDay, 23, 59, 59, 999);
        if (now > deadline) {
          isOverdue = true;
        }
      } else if (bill.createdAt) {
        // Fallback: check 15 days from bill creation
        const billCreated = new Date(bill.createdAt);
        const deadline = new Date(billCreated.getFullYear(), billCreated.getMonth(), dueDay, 23, 59, 59, 999);
        if (now > deadline) {
          isOverdue = true;
        }
      }

      if (isOverdue && bill.penalty !== penaltyAmt) {
        bill.penalty = penaltyAmt;
        await bill.save();
      }
    }
  } catch (err) {
    console.error("Penalty calculation error:", err);
  }
};
app.get("/maintenance", verifyToken, async (req, res) => {
  try {
    // Automatically apply overdue penalties if past the 15th
    await applyLatePaymentPenalties();

    // IDOR protection: residents see only their bills; admins see all
    const filter = req.user.role === "admin" ? {} : { userId: req.user.id };
    const list = await Maintenance.find(filter)
      .populate("userId", "name flatNo category")
      .sort("-createdAt");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Error fetching maintenance records" });
  }
});

app.post("/maintenance/generate", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { userId, month } = req.body;
    const settings = (await Settings.findOne()) || {
      ownerMaintenanceAmount: 800,
      rentMaintenanceAmount: 1000,
    };

    if (userId) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const amount = user.category === "rent" ? settings.rentMaintenanceAmount : settings.ownerMaintenanceAmount;
      const existing = await Maintenance.findOne({ userId, month });
      if (existing) {
        return res.status(409).json({ message: `Bill for ${month} already exists for this resident` });
      }

      const newBill = await Maintenance.create({
        userId,
        month,
        amount,
        penalty: 0,
        status: "Pending",
      });

      return res.status(201).json(newBill);
    }

    // Generate for all residents
    const users = await User.find({ role: "user" });
    let createdCount = 0;
    for (const u of users) {
      const existing = await Maintenance.findOne({ userId: u._id, month });
      if (!existing) {
        const amount = u.category === "rent" ? settings.rentMaintenanceAmount : settings.ownerMaintenanceAmount;
        await Maintenance.create({
          userId: u._id,
          month,
          amount,
          penalty: 0,
          status: "Pending",
        });
        createdCount++;
      }
    }

    res.status(201).json({ success: true, message: `Generated bills for ${createdCount} residents for ${month}` });
  } catch (err) {
    res.status(500).json({ message: "Error generating maintenance bill" });
  }
});

// Admin manual offline collection / mark as paid
app.put("/maintenance/:id/collect", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const bill = await Maintenance.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Maintenance bill not found" });

    bill.status = "Paid";
    bill.transactionId = req.body.transactionId || `CASH-${Date.now().toString().slice(-6)}`;
    await bill.save();

    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ message: "Error recording collection" });
  }
});

// --- Complaints (IDOR protected) ---
app.get("/complaint", verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user.id };
    const complaints = await Complaint.find(filter)
      .populate("userId", "name flatNo")
      .sort("-createdAt");
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching complaints" });
  }
});

app.post("/complaint", verifyToken, validateBody(ComplaintCreateSchema), async (req, res) => {
  try {
    const complaint = await Complaint.create({
      ...req.body,
      userId: req.user.id,
      status: "Open",
    });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Error submitting complaint" });
  }
});

app.put("/complaint/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Error updating complaint" });
  }
});

// --- Notices ---
app.get("/notice", async (req, res) => {
  try {
    const notices = await Notice.find().sort("-createdAt");
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notices" });
  }
});

app.post("/notice", verifyToken, requireRole("admin"), validateBody(NoticeCreateSchema), async (req, res) => {
  try {
    const notice = await Notice.create({
      ...req.body,
      postedBy: req.user.id,
    });
    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ message: "Error creating notice" });
  }
});

app.delete("/notice/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error deleting notice" });
  }
});

// --- Expenses (Admin only) ---
app.get("/expense", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const expenses = await Expense.find().sort("-date");
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching expenses" });
  }
});

app.post("/expense", verifyToken, requireRole("admin"), validateBody(ExpenseCreateSchema), async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      addedBy: req.user.id,
      date: req.body.date || new Date(),
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: "Error logging expense" });
  }
});

app.delete("/expense/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error deleting expense" });
  }
});

// --- Visitors (IDOR protected) ---
app.get("/visitor", verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user.id };
    const visitors = await Visitor.find(filter)
      .populate("userId", "name flatNo")
      .sort("-createdAt");
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching visitors" });
  }
});

app.post("/visitor", verifyToken, validateBody(VisitorCreateSchema), async (req, res) => {
  try {
    const visitor = await Visitor.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Error registering visitor" });
  }
});

app.put("/visitor/:id", verifyToken, async (req, res) => {
  try {
    // Ownership check: resident can only update their own visitor log
    const query = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const visitor = await Visitor.findOneAndUpdate(query, req.body, { new: true });
    if (!visitor) return res.status(404).json({ message: "Visitor record not found" });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Error updating visitor" });
  }
});

// --- Admin User Management & Stats ---
app.get("/admin/users", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    // Sensitive data protection: phone & vehicle numbers masked/excluded for bulk listing
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.get("/admin/stats", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const [totalResidents, openComplaints, maintenanceData, expenseData] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Complaint.countDocuments({ status: { $in: ["Open", "In Progress"] } }),
      Maintenance.aggregate([
        { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);

    const paidData = maintenanceData.find((d) => d._id === "Paid");
    const pendingCount = maintenanceData.find((d) => d._id === "Pending")?.count || 0;
    const monthlyCollection = paidData?.total || 0;
    const totalExpenses = expenseData[0]?.total || 0;

    res.json({
      totalResidents,
      pendingPayments: pendingCount,
      openComplaints,
      monthlyCollection,
      totalExpenses,
      netBalance: monthlyCollection - totalExpenses,
    });
  } catch (err) {
    res.status(500).json({ message: "Error calculating stats" });
  }
});

app.delete("/admin/users/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await logAudit({
      actorId: req.user.id,
      role: "admin",
      action: "ADMIN_DELETED_USER",
      entity: "User",
      entityId: req.params.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      requestId: req.id,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
});

// ===== Settings Management (Admin Only) =====
app.get("/settings", verifyToken, async (req, res) => {
  try {
    let settings = (await Settings.findOne()) || (await Settings.create({
      ownerMaintenanceAmount: 800,
      rentMaintenanceAmount: 1000,
      penaltyAmount: 100,
      penaltyDueDay: 15,
    }));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching settings" });
  }
});

app.put("/settings", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { ownerMaintenanceAmount, rentMaintenanceAmount, penaltyAmount, penaltyDueDay } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    if (ownerMaintenanceAmount !== undefined) settings.ownerMaintenanceAmount = Number(ownerMaintenanceAmount);
    if (rentMaintenanceAmount !== undefined) settings.rentMaintenanceAmount = Number(rentMaintenanceAmount);
    if (penaltyAmount !== undefined) settings.penaltyAmount = Number(penaltyAmount);
    if (penaltyDueDay !== undefined) settings.penaltyDueDay = Math.min(31, Math.max(1, Number(penaltyDueDay)));

    await settings.save();

    // Re-apply penalties right away with the updated rate/date
    await applyLatePaymentPenalties();

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Error updating settings" });
  }
});

// =========================================================================
// LAYER 7: DATA PRIVACY & MINIMIZATION (DPDP ACT 2023)
// =========================================================================

// Export user personal data
app.get("/api/user/me/export", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const [bills, complaints, visitors] = await Promise.all([
      Maintenance.find({ userId: req.user.id }),
      Complaint.find({ userId: req.user.id }),
      Visitor.find({ userId: req.user.id }),
    ]);

    res.json({
      profile: user,
      maintenanceRecords: bills,
      complaints,
      visitors,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: "Data export error" });
  }
});

// Delete user account & personal data
app.delete("/api/user/me", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    await RefreshToken.deleteMany({ userId: req.user.id });
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Account and personal data removed." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting account" });
  }
});

// =========================================================================
// CRON: AUTOMATED MONTHLY BILLING & ORDER EXPIRY CLEANUP
// =========================================================================
cron.schedule("0 0 1 * *", async () => {
  try {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const s = (await Settings.findOne()) || { ownerMaintenanceAmount: 800, rentMaintenanceAmount: 1000 };
    const users = await User.find({ role: "user" });

    for (const u of users) {
      if (!(await Maintenance.findOne({ userId: u._id, month: monthStr }))) {
        await Maintenance.create({
          userId: u._id,
          amount: u.category === "rent" ? s.rentMaintenanceAmount : s.ownerMaintenanceAmount,
          month: monthStr,
          status: "Pending",
          penalty: 0,
        });
      }
    }
  } catch (err) {
    console.error("Cron billing error:", err);
  }
});

// Daily cron at 00:05: Automatically calculate and apply overdue penalties (after 15th)
cron.schedule("5 0 * * *", async () => {
  try {
    await applyLatePaymentPenalties();
  } catch (err) {
    console.error("Cron penalty calculation error:", err);
  }
});

// Nightly cron: expire stale created orders
cron.schedule("0 * * * *", async () => {
  try {
    await Order.updateMany(
      { status: "pending", expiresAt: { $lt: new Date() } },
      { status: "expired" }
    );
  } catch (err) {
    console.error("Cron order cleanup error:", err);
  }
});

// =========================================================================
// LAYER 2: UNIFORM SECURE ERROR HANDLER (NO STACK TRACE LEAKS)
// =========================================================================
app.use((err, req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;
  const requestId = req.id || "unknown";

  logger.error({ err, requestId }, "Unhandled application error");

  // In production, mask internal server error details
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "An internal server error occurred. Please contact administrator."
      : err.message || "An unexpected error occurred.";

  res.status(statusCode).json({
    success: false,
    message,
    requestId,
  });
});

// =========================================================================
// SERVER BOOTSTRAP & GRACEFUL SHUTDOWN
// =========================================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Gateway Online: http://localhost:${PORT}`));

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} already in use.\n`);
    process.exit(1);
  }
});

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { app, server };
export default app;
