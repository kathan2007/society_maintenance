import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, CheckCircle, Clock, ShieldAlert,
  User, Search, Loader2, ChevronDown,
} from "lucide-react";

interface ComplaintType {
  _id: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  userId?: { name: string; flatNo: string };
}

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  "Pending":     { bg: "var(--warning-bg)",  color: "var(--warning)",  dot: "#F59E0B" },
  "In Progress": { bg: "var(--accent-light)", color: "var(--accent-text)", dot: "var(--accent)" },
  "Resolved":    { bg: "var(--success-bg)",  color: "var(--success)",  dot: "#10B981" },
};

function statusStyle(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS["Pending"];
}

const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/complaint`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.put(
        `${API_BASE_URL}/complaint/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ msg: `Status updated → ${newStatus}`, ok: true });
      fetchComplaints();
    } catch (err) {
      setToast({ msg: "Failed to update status", ok: false });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filtered = complaints.filter((c) => {
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      (c.userId?.name?.toLowerCase() || "").includes(q) ||
      (c.userId?.flatNo?.toLowerCase() || "").includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    All: complaints.length,
    Pending: complaints.filter((c) => c.status === "Pending").length,
    "In Progress": complaints.filter((c) => c.status === "In Progress").length,
    Resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

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
              background: "var(--danger-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--danger)",
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", marginBottom: 2 }}>
              Resolution Centre
            </h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
              Manage resident complaints
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
            placeholder="Search complaints…"
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

      {/* ── Status Filter Chips ── */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-5)", flexWrap: "wrap" }}>
        {(["All", "Pending", "In Progress", "Resolved"] as const).map((s) => {
          const active = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-pill)",
                border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                background: active ? "var(--accent)" : "var(--bg-surface)",
                color: active ? "var(--on-accent)" : "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                fontWeight: active ? "var(--weight-semibold)" : "var(--weight-regular)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s}
              <span
                style={{
                  background: active ? "rgba(11,27,58,0.2)" : "var(--border)",
                  color: active ? "var(--on-accent)" : "var(--text-muted)",
                  borderRadius: "var(--radius-pill)",
                  padding: "0 6px",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-bold)",
                }}
              >
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-5)",
              borderRadius: "var(--radius-md)",
              background: toast.ok ? "var(--success-bg)" : "var(--danger-bg)",
              color: toast.ok ? "var(--success)" : "var(--danger)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              marginBottom: "var(--space-4)",
              border: `1px solid ${toast.ok ? "var(--success)" : "var(--danger)"}`,
            }}
          >
            {toast.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="app-card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-v3" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "var(--space-5)" }}>Resident</th>
                <th>Category</th>
                <th>Details</th>
                <th>Status</th>
                <th>Filed</th>
                <th style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>Update</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ textAlign: "center", padding: "var(--space-12) var(--space-6)", color: "var(--text-muted)" }}>
                      <ShieldAlert size={48} style={{ opacity: 0.25, marginBottom: "var(--space-3)" }} />
                      <p style={{ fontWeight: "var(--weight-semibold)", maxWidth: "none" }}>
                        No complaints {filterStatus !== "All" ? `with status "${filterStatus}"` : "found"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c, index) => {
                  const ss = statusStyle(c.status);
                  return (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      {/* Resident */}
                      <td style={{ paddingLeft: "var(--space-5)", paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "var(--radius-pill)",
                              background: "var(--bg-sidebar)",
                              color: "var(--accent)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "var(--weight-bold)",
                              fontSize: "var(--text-xs)",
                              flexShrink: 0,
                            }}
                          >
                            {c.userId?.name ? c.userId.name.charAt(0).toUpperCase() : <User size={14} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                              {c.userId?.name || "Unknown"}
                            </div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                              Unit {c.userId?.flatNo || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px var(--space-3)",
                            borderRadius: "var(--radius-pill)",
                            background: "var(--accent-light)",
                            color: "var(--accent-text)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--weight-semibold)",
                            textTransform: "capitalize",
                          }}
                        >
                          {c.category}
                        </span>
                      </td>

                      {/* Details */}
                      <td style={{ maxWidth: 280 }}>
                        <p
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--text-secondary)",
                            margin: 0,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {c.message}
                        </p>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "var(--space-1)",
                            padding: "var(--space-1) var(--space-3)",
                            borderRadius: "var(--radius-pill)",
                            background: ss.bg,
                            color: ss.color,
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--weight-semibold)",
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ss.dot, flexShrink: 0 }} />
                          {c.status}
                        </span>
                      </td>

                      {/* Filed date */}
                      <td>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                          <div>{new Date(c.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
                          <div>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </td>

                      {/* Update select */}
                      <td style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <select
                            value={c.status}
                            onChange={(e) => updateStatus(c._id, e.target.value)}
                            style={{
                              appearance: "none",
                              background: "var(--bg-surface)",
                              border: "1.5px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              padding: "var(--space-1) var(--space-6) var(--space-1) var(--space-3)",
                              fontSize: "var(--text-xs)",
                              fontWeight: "var(--weight-semibold)",
                              color: "var(--text-primary)",
                              cursor: "pointer",
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                        </div>
                      </td>
                    </motion.tr>
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

export default AdminComplaints;
