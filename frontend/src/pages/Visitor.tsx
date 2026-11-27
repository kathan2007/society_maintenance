import React, { useEffect, useState } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  Phone,
  UserCheck,
  Shield,
  Filter,
} from "lucide-react";
import apiClient from "../api/client";
import { formatDate } from "../utils";
import toast from "react-hot-toast";

interface VisitorItem {
  _id: string;
  name: string;
  phone: string;
  expectedDate: string;
  purpose: string;
  status: "Expected" | "Entered" | "Exited";
  createdAt: string;
}

const VisitorPage: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  // Pre-approval form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [purpose, setPurpose] = useState("Guest / Social");

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<VisitorItem[]>("/visitor");
      setVisitors(res.data || []);
    } catch (err) {
      toast.error("Failed to sync visitor logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handlePreApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/visitor", {
        name: name.trim(),
        phone: phone.trim(),
        expectedDate,
        purpose,
      });
      setName("");
      setPhone("");
      setExpectedDate("");
      toast.success("Visitor pre-approved for gate entry");
      fetchVisitors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to log visitor");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = visitors.filter(
    (v) => filterStatus === "All" || v.status === filterStatus
  );

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="mb-5">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "var(--space-1)",
          }}
        >
          Visitor Gate Pre-Approval & Log
        </h1>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 0 }}>
          Pre-authorize personal guests, delivery personnel, and service technicians for fast security gate entry.
        </p>
      </div>

      <div className="row g-4">
        {/* Pre-Approval Form */}
        <div className="col-lg-5">
          <div className="app-card">
            <div className="d-flex align-items-center gap-2 mb-4">
              <UserCheck size={20} style={{ color: "var(--accent)" }} />
              <h5 style={{ margin: 0, fontWeight: 600 }}>Pre-Approve Visitor</h5>
            </div>

            <form onSubmit={handlePreApprove}>
              <div className="mb-3">
                <label className="form-label-v3">Guest / Visitor Name</label>
                <input
                  type="text"
                  className="form-control-v3"
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-v3">Contact Mobile (10 digits)</label>
                <input
                  type="tel"
                  className="form-control-v3"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-v3">Expected Arrival Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control-v3"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label-v3">Visit Purpose</label>
                <select
                  className="form-select-v3"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="Guest / Social">Guest / Family</option>
                  <option value="Courier / Parcel">Courier / Delivery</option>
                  <option value="Home Maintenance">Home Maintenance / Repair</option>
                  <option value="Other">Other Business</option>
                </select>
              </div>

              <button type="submit" className="btn-gold w-100" disabled={submitting}>
                <Plus size={16} />
                <span>{submitting ? "Registering Pass..." : "Generate Gate Pass"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Visitor History & Status */}
        <div className="col-lg-7">
          <div className="app-card">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2">
                <Users size={20} style={{ color: "var(--primary)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Gate Entry Registry</h5>
              </div>

              <div className="d-flex align-items-center gap-2">
                <Filter size={14} style={{ color: "var(--text-muted)" }} />
                {["All", "Expected", "Entered", "Exited"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    style={{
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 10px",
                      fontSize: "var(--text-xs)",
                      fontWeight: filterStatus === s ? 600 : 500,
                      backgroundColor: filterStatus === s ? "var(--accent)" : "var(--bg-canvas)",
                      color: filterStatus === s ? "var(--on-accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-5 text-center" style={{ color: "var(--text-muted)" }}>
                <div className="spinner-border text-primary mb-2" role="status" />
                <p style={{ fontSize: "var(--text-sm)" }}>Loading security log...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="table-responsive">
                <table className="table-v3">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Expected Date</th>
                      <th>Purpose</th>
                      <th>Gate Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v._id}>
                        <td>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                            {v.name}
                          </span>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                            +91 {v.phone}
                          </span>
                        </td>
                        <td style={{ fontSize: "var(--text-xs)" }}>
                          {formatDate(v.expectedDate)}
                        </td>
                        <td>
                          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                            {v.purpose}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge-v3 ${
                              v.status === "Entered"
                                ? "badge-success"
                                : v.status === "Exited"
                                ? "badge-info"
                                : "badge-warning"
                            }`}
                          >
                            {v.status === "Entered" ? (
                              <CheckCircle size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            <span>{v.status || "Expected"}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
                <Users size={40} className="mx-auto mb-2 opacity-40" />
                <h6 style={{ color: "var(--text-primary)", marginBottom: "4px" }}>
                  No Visitor Logs Found
                </h6>
                <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>
                  No pre-approved gate passes matching status '{filterStatus}'.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorPage;
