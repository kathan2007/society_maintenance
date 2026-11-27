// ============================================================
// Shared TypeScript types for the Society Portal
// ============================================================

export interface User {
  _id: string;
  name: string;
  username: string;
  flatNo: string;
  phoneNumber: string;
  role: "user" | "admin";
  category: "owner" | "rent";
  vehicleCount: number;
  vehicleNumbers?: string[];
  createdAt: string;
}

export interface AuthUser {
  id: string;
  role: "user" | "admin";
  name?: string;
  flatNo?: string;
}

export interface Maintenance {
  _id: string;
  userId: string | User;
  amount: number;
  penalty: number;
  totalAmount: number;
  month: string; // YYYY-MM
  status: "Pending" | "Paid" | "Overdue";
  paidAt?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Complaint {
  _id: string;
  userId: string | User;
  category: string;
  description: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  postedBy: string | User;
  createdAt: string;
}

export interface Expense {
  _id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  addedBy: string | User;
  createdAt: string;
}

export interface Visitor {
  _id: string;
  userId: string | User;
  visitorName: string;
  purpose: string;
  vehicleNumber?: string;
  status: "Entered" | "Exited" | "Pending";
  entryTime?: string;
  exitTime?: string;
  createdAt: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  upiId: string;
  maintenanceId: string;
  qrCodeData?: string;
}

export interface PaymentStatus {
  status: "pending" | "paid" | "failed";
  transactionId?: string;
  paidAt?: string;
}

export interface DashboardStats {
  totalResidents: number;
  pendingPayments: number;
  openComplaints: number;
  monthlyCollection: number;
  totalExpenses: number;
  netBalance: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
