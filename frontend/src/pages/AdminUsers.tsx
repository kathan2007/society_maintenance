import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Users, Home, Phone, Calendar, ShieldCheck, Search, Loader2 } from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  email: string;
  username: string;
  flatNo: string;
  phoneNumber: string;
  vehicleCount: number;
  vehicleNumbers: string;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.flatNo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.vehicleNumbers?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="main-content"
      style={{ padding: "var(--space-6)" }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          marginBottom: "var(--space-8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-md)",
              background: "var(--accent-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-text)",
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", marginBottom: 2 }}>
              Resident Registry
            </h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
              {users.length} registered members
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
            minWidth: 260,
          }}
        >
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search name, flat, vehicle…"
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

      {/* ── Count Chip ── */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "var(--accent-light)",
            color: "var(--accent-text)",
            borderRadius: "var(--radius-pill)",
            padding: "var(--space-1) var(--space-3)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          <ShieldCheck size={13} />
          {filteredUsers.length} profiles shown
        </span>
      </div>

      {/* ── Table ── */}
      <div className="app-card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-v3" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "var(--space-5)" }}>Resident</th>
                <th>Unit</th>
                <th>Contact</th>
                <th>Vehicles</th>
                <th style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "var(--space-12) var(--space-6)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Users size={48} style={{ opacity: 0.3, marginBottom: "var(--space-3)" }} />
                      <p style={{ fontWeight: "var(--weight-semibold)", maxWidth: "none" }}>
                        No residents match your search
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    {/* Resident cell */}
                    <td style={{ paddingLeft: "var(--space-5)", paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
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
                          {initials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--space-1)",
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                          borderRadius: "var(--radius-pill)",
                          padding: "var(--space-1) var(--space-3)",
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-semibold)",
                        }}
                      >
                        <Home size={12} />
                        {u.flatNo || "—"}
                      </span>
                    </td>

                    {/* Contact */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                        <Phone size={13} style={{ color: "var(--text-muted)" }} />
                        {u.phoneNumber || "—"}
                      </div>
                    </td>

                    {/* Vehicles */}
                    <td>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                        <span style={{ fontWeight: "var(--weight-semibold)" }}>
                          {u.vehicleCount ?? 0}
                        </span>{" "}
                        vehicle{u.vehicleCount !== 1 ? "s" : ""}
                        {u.vehicleNumbers && (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                            {u.vehicleNumbers}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                        <Calendar size={13} />
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminUsers;
