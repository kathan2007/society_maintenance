import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { History, CheckCircle, XCircle, Clock, Search, FileText, Loader2 } from "lucide-react";

interface OrderType {
  _id: string;
  orderId: string;
  amount: number;
  status: string;
  paymentId?: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  success: {
    icon: <CheckCircle size={14} />,
    bg: "var(--success-bg)",
    color: "var(--success)",
    label: "SUCCESS",
  },
  failed: {
    icon: <XCircle size={14} />,
    bg: "var(--danger-bg)",
    color: "var(--danger)",
    label: "FAILED",
  },
  expired: {
    icon: <Clock size={14} />,
    bg: "var(--warning-bg)",
    color: "var(--warning)",
    label: "EXPIRED",
  },
};

const PaymentHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/payment/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const filtered = orders.filter(
    (o) =>
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="main-content"
      style={{ padding: "var(--space-6)" }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-md)",
              background: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <History size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", marginBottom: 2 }}>
              Payment History
            </h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
              {orders.length} digital transactions
            </p>
          </div>
        </div>

        {/* Search */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "var(--bg-surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-pill)",
            padding: "var(--space-2) var(--space-4)",
            minWidth: 240,
          }}
        >
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search order ID or status…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "var(--text-sm)",
              color: "var(--text-primary)",
              width: "100%",
            }}
          />
        </label>
      </div>

      {/* ── Summary Chips ── */}
      {!loading && orders.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)", flexWrap: "wrap" }}>
          {Object.entries(STATUS_MAP).map(([k, v]) => {
            const count = orders.filter((o) => o.status === k).length;
            if (count === 0) return null;
            return (
              <span
                key={k}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-pill)",
                  background: v.bg,
                  color: v.color,
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-semibold)",
                }}
              >
                {v.icon}
                {count} {v.label}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Table ── */}
      <div className="app-card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--border)" }}>
          <h6 style={{ margin: 0, fontWeight: "var(--weight-semibold)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <FileText size={16} style={{ color: "var(--accent)" }} />
            Transaction Audit Log
          </h6>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table-v3" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "var(--space-5)" }}>Order ID</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Gateway Ref</th>
                <th style={{ paddingRight: "var(--space-5)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{ textAlign: "center", padding: "var(--space-12) var(--space-6)", color: "var(--text-muted)" }}>
                      <FileText size={48} style={{ opacity: 0.25, marginBottom: "var(--space-3)" }} />
                      <p style={{ fontWeight: "var(--weight-semibold)", maxWidth: "none" }}>No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const ss = STATUS_MAP[order.status] || STATUS_MAP["expired"];
                  return (
                    <tr key={order._id} style={{ borderBottom: "1px solid var(--border)" }}>
                      {/* Order ID */}
                      <td
                        style={{
                          paddingLeft: "var(--space-5)",
                          paddingTop: "var(--space-3)",
                          paddingBottom: "var(--space-3)",
                          fontFamily: "monospace",
                          fontSize: "var(--text-sm)",
                          fontWeight: "var(--weight-semibold)",
                          color: "var(--primary)",
                        }}
                      >
                        {order.orderId}
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-GB")}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                          {new Date(order.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Amount */}
                      <td>
                        <span style={{ fontWeight: "var(--weight-bold)", fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
                          ₹{order.amount.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Gateway Ref */}
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                          {order.paymentId || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ paddingRight: "var(--space-5)" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "var(--space-2)",
                            padding: "var(--space-1) var(--space-3)",
                            borderRadius: "var(--radius-pill)",
                            background: ss.bg,
                            color: ss.color,
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--weight-bold)",
                          }}
                        >
                          {ss.icon}
                          {ss.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentHistory;
