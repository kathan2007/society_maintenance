import React, { useEffect, useState } from "react";
import {
  Wallet,
  CheckCircle,
  FileText,
  Search,
  Download,
  Clock,
  CreditCard,
  Plus,
  RefreshCw,
  Filter,
} from "lucide-react";
import apiClient from "../api/client";
import UpiQrModal from "../components/payment/UpiQrModal";
import { formatCurrency, formatDate, generateReceiptPdf } from "../utils";
import toast from "react-hot-toast";
import type { Maintenance } from "../types";

const MaintenancePage: React.FC = () => {
  const [bills, setBills] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [generateMonth, setGenerateMonth] = useState("");
  const [generating, setGenerating] = useState(false);

  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("name") || "Resident";
  const userFlatNo = localStorage.getItem("flatNo") || "A-101";

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Maintenance[]>("/maintenance");
      setBills(res.data || []);
    } catch (err) {
      toast.error("Failed to load maintenance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePay = async (bill: Maintenance) => {
    try {
      toast.loading("Initiating secure payment order...", { id: "pay-order" });
      const payAmount = bill.totalAmount || bill.amount;
      const res = await apiClient.post("/api/payment/create-order", {
        maintenanceId: bill._id,
        amount: payAmount,
      });
      toast.dismiss("pay-order");
      setActiveOrder(res.data);
      setShowQrModal(true);
    } catch (err: any) {
      toast.dismiss("pay-order");
      toast.error(err.response?.data?.message || "Failed to initialize payment");
    }
  };

  const handleDownloadReceipt = (bill: Maintenance) => {
    generateReceiptPdf({
      societyName: "Shree Hari Gift City Residential Association",
      flatNo: (typeof bill.userId === "object" ? bill.userId?.flatNo : userFlatNo) || userFlatNo,
      residentName: (typeof bill.userId === "object" ? bill.userId?.name : userName) || userName,
      month: bill.month,
      amount: bill.amount,
      penalty: bill.penalty || 0,
      totalAmount: bill.totalAmount || bill.amount,
      transactionId: bill.transactionId || `TXN${bill._id.slice(-8)}`,
      paidAt: bill.paidAt || bill.createdAt,
    });
    toast.success("Receipt downloaded successfully");
  };

  const handleGenerateAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateMonth) return;
    try {
      setGenerating(true);
      await apiClient.post("/maintenance/generate", { month: generateMonth });
      toast.success(`Bills generated for ${generateMonth}`);
      setGenerateMonth("");
      fetchBills();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate bills");
    } finally {
      setGenerating(false);
    }
  };

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchesStatus = filterStatus === "All" || b.status === filterStatus;
    const matchesSearch =
      b.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof b.userId === "object" && b.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof b.userId === "object" && b.userId?.flatNo?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalDues = bills
    .filter((b) => b.status === "Pending")
    .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-3xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "var(--space-1)",
            }}
          >
            Maintenance & Payments
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 0 }}>
            Review statements, pay monthly society fees, and retrieve verifiable PDF receipts.
          </p>
        </div>

        {role === "admin" ? (
          <form onSubmit={handleGenerateAll} className="d-flex align-items-center gap-2">
            <input
              type="month"
              className="form-control-v3"
              style={{ minHeight: "40px", maxWidth: "160px" }}
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              required
            />
            <button type="submit" className="btn-gold" style={{ minHeight: "40px" }} disabled={generating}>
              <Plus size={16} />
              <span>{generating ? "Generating..." : "Generate Month"}</span>
            </button>
          </form>
        ) : (
          totalDues > 0 && (
            <div
              style={{
                padding: "10px 16px",
                backgroundColor: "var(--warning-bg)",
                border: "1px solid rgba(122, 75, 0, 0.2)",
                borderRadius: "var(--radius-md)",
                color: "var(--warning)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
              }}
            >
              Pending Outstanding: {formatCurrency(totalDues)}
            </div>
          )
        )}
      </div>

      {/* ── Search and Filter Controls ── */}
      <div
        className="app-card mb-4"
        style={{ padding: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between" }}
      >
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "360px" }}>
          <Search size={18} style={{ color: "var(--text-muted)", marginLeft: "8px" }} />
          <input
            type="text"
            className="form-control-v3"
            placeholder="Search by month or flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minHeight: "40px" }}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <Filter size={16} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>Filter:</span>
          {["All", "Pending", "Paid"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              style={{
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "6px 14px",
                fontSize: "var(--text-xs)",
                fontWeight: filterStatus === st ? 600 : 500,
                backgroundColor: filterStatus === st ? "var(--accent)" : "var(--bg-canvas)",
                color: filterStatus === st ? "var(--on-accent)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchBills}
            title="Refresh"
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 10px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Bills Table ── */}
      <div className="app-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-5 text-center" style={{ color: "var(--text-muted)" }}>
            <div className="spinner-border text-primary mb-2" role="status" />
            <p style={{ fontSize: "var(--text-sm)" }}>Loading maintenance registry...</p>
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="table-responsive">
            <table className="table-v3">
              <thead>
                <tr>
                  {role === "admin" && <th>Resident / Unit</th>}
                  <th>Billing Month</th>
                  <th>Base Dues</th>
                  <th>Penalty</th>
                  <th>Total Payable</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => (
                  <tr key={b._id}>
                    {role === "admin" && (
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                          {typeof b.userId === "object" ? b.userId?.name : "Resident"}
                        </span>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                          Flat {typeof b.userId === "object" ? b.userId?.flatNo : "—"}
                        </span>
                      </td>
                    )}
                    <td style={{ fontWeight: 600 }}>{b.month}</td>
                    <td className="tabular-nums">{formatCurrency(b.amount)}</td>
                    <td className="tabular-nums" style={{ color: (b.penalty || 0) > 0 ? "var(--danger)" : "var(--text-muted)" }}>
                      {formatCurrency(b.penalty || 0)}
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>
                      {formatCurrency(b.totalAmount || b.amount)}
                    </td>
                    <td>
                      <span className={`badge-v3 ${b.status === "Paid" ? "badge-paid" : "badge-pending"}`}>
                        {b.status === "Paid" ? <CheckCircle size={13} /> : <Clock size={13} />}
                        <span>{b.status}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        {b.status === "Paid" ? (
                          <button
                            type="button"
                            className="btn-outline-gold"
                            onClick={() => handleDownloadReceipt(b)}
                            style={{ minHeight: "36px", padding: "0 12px", fontSize: "var(--text-xs)" }}
                          >
                            <Download size={14} />
                            <span>Receipt PDF</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-gold"
                            onClick={() => handlePay(b)}
                            style={{ minHeight: "36px", padding: "0 14px", fontSize: "var(--text-xs)" }}
                          >
                            <CreditCard size={14} />
                            <span>Pay Dues</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
            <Wallet size={40} className="mx-auto mb-3 opacity-40" />
            <h5 style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "4px" }}>
              No Maintenance Bills Found
            </h5>
            <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>
              {filterStatus !== "All"
                ? `No bills matching filter '${filterStatus}'.`
                : "Your account is up-to-date with zero outstanding records."}
            </p>
          </div>
        )}
      </div>

      {/* ── UPI QR Payment Modal ── */}
      <UpiQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        order={activeOrder}
        onSuccess={() => {
          fetchBills();
          toast.success("Payment confirmed! Updating records...");
        }}
      />
    </div>
  );
};

export default MaintenancePage;
