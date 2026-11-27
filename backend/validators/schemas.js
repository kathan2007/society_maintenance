import { z } from "zod";
import sanitizeHtml from "sanitize-html";

// Helper to sanitize freeform text input against XSS
const sanitizeString = (str) =>
  sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

// MongoDB ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
// Indian 10-digit mobile number regex
const phoneRegex = /^[6-9]\d{9}$/;
// Month format YYYY-MM
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const RegisterSchema = z
  .object({
    name: z.string().min(2).max(100).transform(sanitizeString),
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, and dashes")
      .transform((val) => val.toLowerCase().trim()),
    password: z.string().min(10, "Password must be at least 10 characters long"),
    role: z.enum(["user", "admin"]).default("user"),
    category: z.enum(["owner", "rent"]).default("owner"),
    flatNo: z.string().max(20).optional().default("OFFICE"),
    phoneNumber: z.string().regex(phoneRegex, "Phone must be a valid 10-digit Indian number").optional(),
    vehicleCount: z.number().int().min(0).max(10).optional().default(0),
    vehicleNumbers: z.string().max(200).optional().default(""),
    adminInviteCode: z.string().optional(),
  })
  .strict();

export const LoginSchema = z
  .object({
    username: z.string().min(1).transform((val) => val.toLowerCase().trim()),
    password: z.string().min(1),
    role: z.string().optional(),
    totpToken: z.string().length(6).optional(),
  })
  .strict();

export const RefreshTokenSchema = z
  .object({
    refreshToken: z.string().optional(),
  })
  .strict();

export const ComplaintCreateSchema = z
  .object({
    category: z.string().min(2).max(50).transform(sanitizeString),
    description: z.string().min(5).max(2000).transform(sanitizeString),
  })
  .strict();

export const NoticeCreateSchema = z
  .object({
    title: z.string().min(3).max(200).transform(sanitizeString),
    content: z.string().min(5).max(5000).transform(sanitizeString),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  })
  .strict();

export const ExpenseCreateSchema = z
  .object({
    category: z.string().min(2).max(100).transform(sanitizeString),
    description: z.string().min(3).max(500).transform(sanitizeString),
    amount: z.number().positive("Amount must be greater than zero"),
    date: z.string().or(z.date()).optional(),
  })
  .strict();

export const VisitorCreateSchema = z
  .object({
    name: z.string().min(2).max(100).transform(sanitizeString),
    phone: z.string().regex(phoneRegex, "Must be a valid 10-digit phone number"),
    expectedDate: z.string().or(z.date()),
    purpose: z.string().max(200).optional().default("General Visit").transform(sanitizeString),
  })
  .strict();

export const CreatePaymentOrderSchema = z
  .object({
    maintenanceId: z.string().regex(objectIdRegex, "Invalid maintenance ID format"),
    provider: z.enum(["razorpay", "stripe", "upi"]).default("razorpay"),
    idempotencyKey: z.string().max(100).optional(),
    // NOTE: client amount is completely excluded from schema to prevent tampering
  })
  .strict();

export const MonthQuerySchema = z
  .object({
    month: z.string().regex(monthRegex, "Month must be in YYYY-MM format").optional(),
  })
  .strict();
