import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  AlertCircle,
  Bell,
  Users,
  CreditCard,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  PieChart as PieIcon,
  BarChart2,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import apiClient from "../api/client";
import { formatCurrency, formatDate } from "../utils";
import type { Maintenance, Complaint, Notice, Expense } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Maintenance[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const userName = localStorage.getItem("name") || "Resident";
  const userFlatNo = localStorage.getItem("flatNo") || "A-101";

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [billsRes, complaintsRes, noticesRes, expensesRes] = await Promise.allSettled([
          apiClient.get<Maintenance[]>("/maintenance"),
          apiClient.get<Complaint[]>("/complaint"),
          apiClient.get<Notice[]>("/notice"),
          apiClient.get<Expense[]>("/expense"),
        ]);

        if (billsRes.status === "fulfilled") setBills(billsRes.value.data || []);
        if (complaintsRes.status === "fulfilled") setComplaints(complaintsRes.value.data || []);
        if (noticesRes.status === "fulfilled") setNotices(noticesRes.value.data || []);
        if (expensesRes.status === "fulfilled") setExpenses(expensesRes.value.data || []);
      } catch (err) {
        // handled silently
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Compute Real Metrics
  const pendingBills = bills.filter((b) => b.status === "Pending");
  const pendingAmount = pendingBills.reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
  const activeComplaints = complaints.filter(
    (c) => c.status === "Open" || c.status === "In Progress"
  );
  const recentBills = bills.slice(0, 4);
  const recentNotices = notices.slice(0, 3);
  const recentComplaints = complaints.slice(0, 3);

  // Group monthly expenses for Chart
  const expenseCatMap: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.category || "General";
    expenseCatMap[cat] = (expenseCatMap[cat] || 0) + Number(e.amount || 0);
  });
  const expenseCategories = Object.keys(expenseCatMap);
  const expenseValues = Object.values(expenseCatMap);

  // Maintenance Inflow vs Outflow
  const totalPaidInflow = bills
    .filter((b) => b.status === "Paid")
    .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
  const totalExpenseOutflow = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const barChartData = {
    labels: ["Society Treasury"],
    datasets: [
      {
        label: "Maintenance Collections",
        data: [totalPaidInflow],
        backgroundColor: "#1F4FD8",
        borderRadius: 8,
        barPercentage: 0.5,
      },
      {
        label: "Operational Expenses",
        data: [totalExpenseOutflow],
        backgroundColor: "#C9A24B",
        borderRadius: 8,
        barPercentage: 0.5,
      },
    ],
  };

  const pieChartData = {
    labels: expenseCategories,
    datasets: [
      {
        data: expenseValues,
        backgroundColor: ["#1F4FD8", "#C9A24B", "#14623A", "#7A4B00", "#A32233", "#4A5470"],
        borderWidth: 0,
      },
    ],
  };

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* ── Page Header: Display Heading Playfair Display >= 24px ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
        <div>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              fontWeight: 500,
              display: "block",
              marginBottom: "var(--space-1)",
            }}
          >
            {currentDateStr}
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-4xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.2,
              marginBottom: "var(--space-1)",
            }}
          >
            Welcome, {userName}
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 0 }}>
            Flat {userFlatNo} • Shree Hari Gift City Residential Portal
          </p>
        </div>

        {/* Quick Action Button */}
        {pendingAmount > 0 ? (
          <Link
            to="/maintenance"
            className="btn-gold"
            style={{ minWidth: "160px", textDecoration: "none" }}
          >
            <CreditCard size={18} />
            <span>Pay Dues ({formatCurrency(pendingAmount)})</span>
          </Link>
        ) : (
          <div
            className="d-flex align-items-center gap-2"
            style={{
              padding: "10px 16px",
              backgroundColor: "var(--success-bg)",
              color: "var(--success)",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
            }}
          >
            <CheckCircle2 size={18} />
            <span>All Dues Cleared</span>
          </div>
        )}
      </div>

      {/* ── 4 Real Stat Cards (Section 3.1) ── */}
      <div className="row g-4 mb-5">
        {/* Stat 1: Pending Dues */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Pending Dues</span>
              <Wallet size={20} style={{ color: pendingAmount > 0 ? "var(--danger)" : "var(--success)" }} />
            </div>
            <div className="stat-card-value tabular-nums">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="stat-card-subtext">
              {pendingBills.length} unpaid {pendingBills.length === 1 ? "bill" : "bills"}
            </p>
          </div>
        </div>

        {/* Stat 2: Active Complaints */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Active Complaints</span>
              <AlertCircle size={20} style={{ color: "var(--warning)" }} />
            </div>
            <div className="stat-card-value tabular-nums">
              {activeComplaints.length}
            </div>
            <p className="stat-card-subtext">
              {complaints.length - activeComplaints.length} resolved to date
            </p>
          </div>
        </div>

        {/* Stat 3: Society Bulletins */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Society Bulletins</span>
              <Bell size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div className="stat-card-value tabular-nums">
              {notices.length}
            </div>
            <p className="stat-card-subtext">Active official notices</p>
          </div>
        </div>

        {/* Stat 4: Next Due Date */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Next Due Date</span>
              <Calendar size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div className="stat-card-value" style={{ fontSize: "var(--text-2xl)" }}>
              {pendingBills[0] ? pendingBills[0].month : "Current Month"}
            </div>
            <p className="stat-card-subtext">Billing cycle monthly 1st</p>
          </div>
        </div>
      </div>

      {/* ── Financial Transparency & Expense Breakdown ── */}
      <div className="row g-4 mb-5">
        {/* Treasury Chart */}
        <div className="col-lg-8">
          <div className="app-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <BarChart2 size={20} style={{ color: "var(--primary)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Society Treasury Transparency</h5>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                Audited Collections & Outflow
              </span>
            </div>
            <div style={{ height: "260px" }}>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom",
                      labels: {
                        font: { family: "Inter", size: 13, weight: "bold" },
                        color: "#4A5470",
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ₹ ${(ctx.parsed.y || 0).toLocaleString("en-IN")}`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      ticks: {
                        font: { size: 12 },
                        callback: (v) => `₹ ${Number(v).toLocaleString("en-IN")}`,
                      },
                      grid: { color: "rgba(224, 218, 203, 0.4)" },
                    },
                    x: {
                      ticks: { font: { size: 13, weight: "bold" } },
                      grid: { display: false },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="col-lg-4">
          <div className="app-card h-100 d-flex flex-column">
            <div className="d-flex align-items-center gap-2 mb-4">
              <PieIcon size={20} style={{ color: "var(--accent)" }} />
              <h5 style={{ margin: 0, fontWeight: 600 }}>Expense Allocation</h5>
            </div>
            <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: "220px" }}>
              {expenseCategories.length > 0 ? (
                <div style={{ width: "100%", height: "240px" }}>
                  <Pie
                    data={pieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { font: { family: "Inter", size: 13 }, color: "#4A5470" },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                  <TrendingUp size={36} className="mx-auto mb-2 opacity-50" />
                  <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>
                    No recorded society expenditures this period.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Bills & Notices Section (Equal Height 12-col Grid) ── */}
      <div className="row g-4 mb-5">
        {/* Recent Bills */}
        <div className="col-lg-6">
          <div className="app-card h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <FileText size={20} style={{ color: "var(--primary)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Recent Maintenance Bills</h5>
              </div>
              <Link to="/maintenance" style={{ fontSize: "var(--text-sm)" }}>
                View All
              </Link>
            </div>

            {recentBills.length > 0 ? (
              <div className="table-responsive flex-grow-1">
                <table className="table-v3">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBills.map((b) => (
                      <tr key={b._id}>
                        <td style={{ fontWeight: 600 }}>{b.month}</td>
                        <td className="tabular-nums">{formatCurrency(b.totalAmount || b.amount)}</td>
                        <td>
                          <span className={`badge-v3 ${b.status === "Paid" ? "badge-paid" : "badge-pending"}`}>
                            {b.status === "Paid" ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                            <span>{b.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5 my-auto" style={{ color: "var(--text-muted)" }}>
                <CheckCircle2 size={32} className="mx-auto mb-2 text-success opacity-75" />
                <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>No maintenance bills found for this account.</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Bulletins & Notices */}
        <div className="col-lg-6">
          <div className="app-card h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <Bell size={20} style={{ color: "var(--accent)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Latest Society Bulletins</h5>
              </div>
              <Link to="/notice" style={{ fontSize: "var(--text-sm)" }}>
                All Notices
              </Link>
            </div>

            {recentNotices.length > 0 ? (
              <div className="d-flex flex-column gap-3 flex-grow-1">
                {recentNotices.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      padding: "var(--space-3) var(--space-4)",
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                        {n.title}
                      </span>
                      <span className={`badge-v3 ${n.priority === "high" ? "badge-danger" : "badge-info"}`}>
                        {n.priority}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-secondary)",
                        margin: 0,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 my-auto" style={{ color: "var(--text-muted)" }}>
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>No active notices at this time.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Resident Action Shortcuts (Grid aligned, equal heights) ── */}
      <h5 style={{ fontWeight: 600, marginBottom: "var(--space-4)" }}>Resident Services & Quick Actions</h5>
      <div className="row g-4">
        <div className="col-md-3 col-6">
          <Link
            to="/maintenance"
            className="app-card text-decoration-none d-flex flex-column justify-content-between h-100"
            style={{ color: "inherit", padding: "var(--space-5)" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent-light)",
                  color: "var(--accent-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={20} />
              </div>
              <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-primary)", display: "block" }}>
                Pay Maintenance
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                UPI QR & Receipts
              </span>
            </div>
          </Link>
        </div>

        <div className="col-md-3 col-6">
          <Link
            to="/complaint"
            className="app-card text-decoration-none d-flex flex-column justify-content-between h-100"
            style={{ color: "inherit", padding: "var(--space-5)" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={20} />
              </div>
              <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-primary)", display: "block" }}>
                Raise Complaint
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                Ticket & Tracking
              </span>
            </div>
          </Link>
        </div>

        <div className="col-md-3 col-6">
          <Link
            to="/visitor"
            className="app-card text-decoration-none d-flex flex-column justify-content-between h-100"
            style={{ color: "inherit", padding: "var(--space-5)" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--success-bg)",
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={20} />
              </div>
              <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-primary)", display: "block" }}>
                Pre-approve Visitor
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                Security Gate Entry
              </span>
            </div>
          </Link>
        </div>

        <div className="col-md-3 col-6">
          <Link
            to="/expenses"
            className="app-card text-decoration-none d-flex flex-column justify-content-between h-100"
            style={{ color: "inherit", padding: "var(--space-5)" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(74, 84, 112, 0.1)",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={20} />
              </div>
              <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-primary)", display: "block" }}>
                Society Ledger
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                Audited Statements
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
