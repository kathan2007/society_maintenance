import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  AlertCircle,
  Clock,
  Wallet,
  TrendingUp,
  Settings,
  BarChart3,
  PieChart,
  ShieldAlert,
  ArrowRight,
  DollarSign,
  CheckCircle,
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
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import apiClient from "../api/client";
import { formatCurrency } from "../utils";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    complaints: 0,
    pendingComplaints: 0,
    collectedMaintenance: 0,
    pendingMaintenance: 0,
    totalExpenses: 0,
  });

  const [categoryData, setCategoryData] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: [],
  });

  const [settings, setSettings] = useState({
    ownerMaintenanceAmount: 800,
    rentMaintenanceAmount: 1000,
    penaltyAmount: 100,
    penaltyDueDay: 15,
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const adminName = localStorage.getItem("name") || "Administrator";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, complaintsRes, maintenanceRes, expensesRes, settingsRes] =
        await Promise.allSettled([
          apiClient.get("/admin/users"),
          apiClient.get("/complaint"),
          apiClient.get("/maintenance"),
          apiClient.get("/expense"),
          apiClient.get("/settings"),
        ]);

      const usersList = usersRes.status === "fulfilled" ? usersRes.value.data || [] : [];
      const complaintsList = complaintsRes.status === "fulfilled" ? complaintsRes.value.data || [] : [];
      const billsList = maintenanceRes.status === "fulfilled" ? maintenanceRes.value.data || [] : [];
      const expensesList = expensesRes.status === "fulfilled" ? expensesRes.value.data || [] : [];

      if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
        setSettings(settingsRes.value.data);
      }

      // Calculations
      const collected = billsList
        .filter((b: any) => b.status === "Paid")
        .reduce((sum: number, b: any) => sum + (b.totalAmount || b.amount || 0), 0);

      const pending = billsList
        .filter((b: any) => b.status === "Pending")
        .reduce((sum: number, b: any) => sum + (b.totalAmount || b.amount || 0), 0);

      const totalExp = expensesList.reduce(
        (sum: number, e: any) => sum + Number(e.amount || 0),
        0
      );

      const openComplaints = complaintsList.filter(
        (c: any) => c.status === "Open" || c.status === "In Progress"
      ).length;

      // Group expense categories
      const catMap: Record<string, number> = {};
      expensesList.forEach((e: any) => {
        const cat = e.category || "General";
        catMap[cat] = (catMap[cat] || 0) + Number(e.amount || 0);
      });

      setStats({
        users: usersList.length,
        complaints: complaintsList.length,
        pendingComplaints: openComplaints,
        collectedMaintenance: collected,
        pendingMaintenance: pending,
        totalExpenses: totalExp,
      });

      setCategoryData({
        labels: Object.keys(catMap),
        values: Object.values(catMap),
      });
    } catch (err) {
      toast.error("Failed to sync dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingSettings(true);
      await apiClient.put("/settings", settings);
      toast.success("Society fee configuration updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const netBalance = stats.collectedMaintenance - stats.totalExpenses;

  const barChartData = {
    labels: ["Total Collections", "Total Expenses", "Net Reserve"],
    datasets: [
      {
        label: "Society Capital Breakdown",
        data: [stats.collectedMaintenance, stats.totalExpenses, netBalance],
        backgroundColor: ["#1F4FD8", "#A32233", netBalance >= 0 ? "#14623A" : "#A32233"],
        borderRadius: 8,
      },
    ],
  };

  const pieChartData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.values,
        backgroundColor: ["#1F4FD8", "#C9A24B", "#14623A", "#7A4B00", "#A32233", "#4A5470"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div>
      {/* ── Page Header: Display Heading in Playfair Display >= 24px ── */}
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
            Administrative Governance Protocol
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-3xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.2,
              marginBottom: "var(--space-1)",
            }}
          >
            Management Dashboard
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 0 }}>
            Oversee residential accounts, treasury inflows, operational expenses, and issue resolutions.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link to="/maintenance" className="btn-gold" style={{ textDecoration: "none" }}>
            <DollarSign size={16} />
            <span>Generate Monthly Billing</span>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards Grid (4 Real Cards) ── */}
      <div className="row g-4 mb-5">
        {/* Stat 1: Total Collections */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Total Collections</span>
              <Wallet size={20} style={{ color: "var(--success)" }} />
            </div>
            <div className="stat-card-value tabular-nums">
              {formatCurrency(stats.collectedMaintenance)}
            </div>
            <p className="stat-card-subtext">Realized member maintenance</p>
          </div>
        </div>

        {/* Stat 2: Outstanding Dues */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Outstanding Dues</span>
              <ShieldAlert size={20} style={{ color: "var(--danger)" }} />
            </div>
            <div className="stat-card-value tabular-nums" style={{ color: "var(--danger)" }}>
              {formatCurrency(stats.pendingMaintenance)}
            </div>
            <p className="stat-card-subtext">Uncollected receivables</p>
          </div>
        </div>

        {/* Stat 3: Active Residents */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Registered Flats</span>
              <Users size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div className="stat-card-value tabular-nums">
              {stats.users}
            </div>
            <p className="stat-card-subtext">Occupied residential units</p>
          </div>
        </div>

        {/* Stat 4: Pending Tickets */}
        <div className="col-lg-3 col-sm-6">
          <div className="stat-card-v3">
            <div className="stat-card-label">
              <span>Open Complaints</span>
              <AlertCircle size={20} style={{ color: "var(--warning)" }} />
            </div>
            <div className="stat-card-value tabular-nums">
              {stats.pendingComplaints}
            </div>
            <p className="stat-card-subtext">Awaiting administrative action</p>
          </div>
        </div>
      </div>

      {/* ── Charts & Financial Reserves ── */}
      <div className="row g-4 mb-5">
        {/* Inflow vs Outflow vs Net Reserve Bar Chart */}
        <div className="col-lg-8">
          <div className="app-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <BarChart3 size={20} style={{ color: "var(--primary)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Treasury Reserves & Capital Outflow</h5>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                Audited Ledger Balance
              </span>
            </div>

            <div style={{ height: "260px" }}>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
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

        {/* Expense Categories */}
        <div className="col-lg-4">
          <div className="app-card h-100 d-flex flex-column">
            <div className="d-flex align-items-center gap-2 mb-4">
              <PieChart size={20} style={{ color: "var(--accent)" }} />
              <h5 style={{ margin: 0, fontWeight: 600 }}>Expenditure by Category</h5>
            </div>

            <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: "220px" }}>
              {categoryData.labels.length > 0 ? (
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
                    No recorded operational expenditures.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Society Settings Card (Requirement 3.1) ── */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
          <div className="app-card h-100">
            <div className="d-flex align-items-center gap-2 mb-4">
              <Settings size={20} style={{ color: "var(--accent)" }} />
              <h5 style={{ margin: 0, fontWeight: 600 }}>Society Maintenance Rates</h5>
            </div>
            <form onSubmit={handleUpdateSettings}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label-v3">Owner Monthly Fee (₹)</label>
                  <input
                    type="number"
                    className="form-control-v3"
                    value={settings.ownerMaintenanceAmount}
                    onChange={(e) =>
                      setSettings({ ...settings, ownerMaintenanceAmount: Number(e.target.value) })
                    }
                    min={0}
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label-v3">Tenant Monthly Fee (₹)</label>
                  <input
                    type="number"
                    className="form-control-v3"
                    value={settings.rentMaintenanceAmount}
                    onChange={(e) =>
                      setSettings({ ...settings, rentMaintenanceAmount: Number(e.target.value) })
                    }
                    min={0}
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label-v3">Late Payment Penalty (₹ / month)</label>
                  <input
                    type="number"
                    className="form-control-v3"
                    value={settings.penaltyAmount}
                    onChange={(e) =>
                      setSettings({ ...settings, penaltyAmount: Number(e.target.value) })
                    }
                    min={0}
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label-v3">Penalty Due Day of Month</label>
                  <input
                    type="number"
                    className="form-control-v3"
                    value={settings.penaltyDueDay || 15}
                    onChange={(e) =>
                      setSettings({ ...settings, penaltyDueDay: Number(e.target.value) })
                    }
                    min={1}
                    max={31}
                    required
                  />
                  <small style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    Bills unpaid after this day will automatically incur penalty.
                  </small>
                </div>
              </div>
              <button
                type="submit"
                className="btn-gold mt-4"
                disabled={updatingSettings}
                style={{ minHeight: "40px" }}
              >
                {updatingSettings ? "Saving Settings..." : "Save Rate Structure"}
              </button>
            </form>
          </div>
        </div>

        {/* Administrative Quick Jump Panel */}
        <div className="col-lg-6">
          <div className="app-card h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>Management Modules</h5>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
                Direct shortcuts to administrator registries and logging consoles.
              </p>
            </div>

            <div className="d-flex flex-column gap-2">
              <Link
                to="/admin-users"
                className="d-flex align-items-center justify-content-between p-3 rounded text-decoration-none"
                style={{ backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Users size={18} style={{ color: "var(--primary)" }} />
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Resident Registry & Flat Directory</span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
              </Link>

              <Link
                to="/admin-complaints"
                className="d-flex align-items-center justify-content-between p-3 rounded text-decoration-none"
                style={{ backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle size={18} style={{ color: "var(--warning)" }} />
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Complaints & Redressal Desk</span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
              </Link>

              <Link
                to="/expenses"
                className="d-flex align-items-center justify-content-between p-3 rounded text-decoration-none"
                style={{ backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <DollarSign size={18} style={{ color: "var(--accent-text)" }} />
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Society Ledger & Expense Tracker</span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
