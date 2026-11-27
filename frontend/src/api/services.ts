import apiClient from "./client";
import type { User, Maintenance, Complaint, Notice, Expense, Visitor, PaymentOrder, PaymentStatus, DashboardStats } from "../types";

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<{ token: string; user: User }>("/login", { username, password }),

  register: (data: Partial<User> & { password: string; role?: string }) =>
    apiClient.post<{ token: string; user: User }>("/register", data),
};

// ── Maintenance ───────────────────────────────────────────────
export const maintenanceApi = {
  getAll: () => apiClient.get<Maintenance[]>("/maintenance"),
  generate: (userId: string, month: string) =>
    apiClient.post<Maintenance>("/maintenance/generate", { userId, month }),
  generateAll: (month: string) =>
    apiClient.post<{ count: number }>("/maintenance/generate-all", { month }),
};

// ── Complaints ────────────────────────────────────────────────
export const complaintApi = {
  getAll: () => apiClient.get<Complaint[]>("/complaint"),
  create: (data: { category: string; description: string }) =>
    apiClient.post<Complaint>("/complaint", data),
  update: (id: string, data: Partial<Complaint>) =>
    apiClient.put<Complaint>(`/complaint/${id}`, data),
};

// ── Notices ───────────────────────────────────────────────────
export const noticeApi = {
  getAll: () => apiClient.get<Notice[]>("/notice"),
  create: (data: { title: string; content: string; priority: string }) =>
    apiClient.post<Notice>("/notice", data),
  remove: (id: string) => apiClient.delete(`/notice/${id}`),
};

// ── Expenses ──────────────────────────────────────────────────
export const expenseApi = {
  getAll: () => apiClient.get<Expense[]>("/expense"),
  create: (data: Partial<Expense>) => apiClient.post<Expense>("/expense", data),
  remove: (id: string) => apiClient.delete(`/expense/${id}`),
};

// ── Visitors ──────────────────────────────────────────────────
export const visitorApi = {
  getAll: () => apiClient.get<Visitor[]>("/visitor"),
  create: (data: Partial<Visitor>) => apiClient.post<Visitor>("/visitor", data),
  update: (id: string, data: Partial<Visitor>) =>
    apiClient.put<Visitor>(`/visitor/${id}`, data),
};

// ── Payment ───────────────────────────────────────────────────
export const paymentApi = {
  createOrder: (maintenanceId: string) =>
    apiClient.post<PaymentOrder>("/api/payment/create-order", { maintenanceId }),
  getStatus: (orderId: string) =>
    apiClient.get<PaymentStatus>(`/api/payment/status/${orderId}`),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => apiClient.get<User[]>("/admin/users"),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  getDashboardStats: () => apiClient.get<DashboardStats>("/admin/stats"),
  updateSettings: (data: { ownerMaintenanceAmount: number; rentMaintenanceAmount: number }) =>
    apiClient.put("/settings", data),
  getSettings: () => apiClient.get("/settings"),
};
