import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Shield, Search, Calendar, LogIn, LogOut, UserPlus, ChevronDown, Loader2 } from "lucide-react";

interface VisitorType {
  _id: string;
  name: string;
  phone: string;
  expectedDate: string;
  purpose: string;
  status: string;
  userId?: { name: string; flatNo: string };
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Expected: { bg: "var(--warning-bg)",  color: "var(--warning)" },
  Entered:  { bg: "var(--success-bg)",  color: "var(--success)" },
  Exited:   { bg: "var(--primary-light)", color: "var(--primary)" },
};

const AdminVisitors: React.FC = () => {
  const [data, setData] = useState<VisitorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/visitor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.put(
        `${API_BASE_URL}/visitor/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = data.filter((v) => {
    const matchStatus = filterStatus === "All" || v.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      (v.userId?.flatNo?.toLowerCase() || "").includes(q) ||
      v.purpose.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    All: data.length,
    Expected: data.filter((v) => v.status === "Expected").length,
    Entered: data.filter((v) => v.status === "Entered").length,
    Exited: data.filter((v) => v.status === "Exited").length,
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
              background: "var(--success-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--success)",
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", marginBottom: 2 }}>
              Gate Management
            </h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
              {data.length} visitor logs
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
            placeholder="Search visitor, unit, purpose…"
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

      {/* ── Filter Chips ── */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-5)", flexWrap: "wrap" }}>
        {(["All", "Expected", "Entered", "Exited"] as const).map((s) => {
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
              {s === "Expected" && <Calendar size={13} />}
              {s === "Entered" && <LogIn size={13} />}
              {s === "Exited" && <LogOut size={13} />}
              {s === "All" && <Shield size={13} />}
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

      {/* ── Table ── */}
      <div className="app-card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-v3" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "var(--space-5)" }}>Visitor</th>
                <th>Host Unit</th>
                <th>Purpose</th>
                <th>Expected</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>Gate Action</th>
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
                      <UserPlus size={48} style={{ opacity: 0.25, marginBottom: "var(--space-3)" }} />
                      <p style={{ fontWeight: "var(--weight-semibold)", maxWidth: "none" }}>No visitor records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((v, i) => {
                  const ss = STATUS_STYLES[v.status] || STATUS_STYLES["Expected"];
                  return (
                    <motion.tr
                      key={v._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      {/* Visitor info */}
                      <td style={{ paddingLeft: "var(--space-5)", paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)" }}>
                        <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                          {v.name}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                          {v.phone}
                        </div>
                      </td>

                      {/* Host unit */}
                      <td>
                        <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                          Unit {v.userId?.flatNo || "—"}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                          {v.userId?.name || "General"}
                        </div>
                      </td>

                      {/* Purpose */}
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
                          {v.purpose}
                        </span>
                      </td>

                      {/* Expected date */}
                      <td>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                          <div>
                            {new Date(v.expectedDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <div>
                            {new Date(v.expectedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
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
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ss.color, flexShrink: 0 }} />
                          {v.status}
                        </span>
                      </td>

                      {/* Gate control */}
                      <td style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <select
                            value={v.status}
                            onChange={(e) => updateStatus(v._id, e.target.value)}
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
                            <option value="Expected">Expected</option>
                            <option value="Entered">Mark Entry</option>
                            <option value="Exited">Mark Exit</option>
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

export default AdminVisitors;
