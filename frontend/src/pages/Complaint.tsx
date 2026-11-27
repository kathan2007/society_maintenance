import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  LifeBuoy,
  Inbox,
  Filter,
} from "lucide-react";
import apiClient from "../api/client";
import { formatDate } from "../utils";
import toast from "react-hot-toast";
import type { Complaint } from "../types";

const ComplaintPage: React.FC = () => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = [
    "Maintenance",
    "Plumbing",
    "Electrical",
    "Security",
    "Elevator",
    "Cleanliness",
    "General",
  ];

  const fetchComplaints = async () => {
    try {
      const res = await apiClient.get<Complaint[]>("/complaint");
      setComplaints(res.data || []);
    } catch (err) {
      toast.error("Failed to sync issue records");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      toast.error("Please provide a description of at least 5 characters.");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/complaint", {
        category,
        description: description.trim(),
      });
      setDescription("");
      toast.success("Support ticket submitted successfully");
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit ticket");
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter(
    (c) => filterCategory === "All" || c.category === filterCategory
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
          Community Redressal & Support
        </h1>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 0 }}>
          Submit maintenance requests, report facility disruptions, and monitor resolution progress.
        </p>
      </div>

      <div className="row g-4">
        {/* Ticket Submission Form */}
        <div className="col-lg-5">
          <div className="app-card">
            <div className="d-flex align-items-center gap-2 mb-4">
              <LifeBuoy size={20} style={{ color: "var(--accent)" }} />
              <h5 style={{ margin: 0, fontWeight: 600 }}>Log a New Issue</h5>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label-v3">Issue Category</label>
                <select
                  className="form-select-v3"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label-v3">Detailed Description</label>
                <textarea
                  className="form-control-v3"
                  rows={4}
                  placeholder="Describe location, nature of issue, and urgency..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: "vertical" }}
                  required
                />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Minimum 5 characters. Server-sanitized against script injection.
                </span>
              </div>

              <button type="submit" className="btn-gold w-100" disabled={loading}>
                <Send size={16} />
                <span>{loading ? "Transmitting Ticket..." : "Submit Ticket"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Existing Tickets Feed */}
        <div className="col-lg-7">
          <div className="app-card">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2">
                <MessageSquare size={20} style={{ color: "var(--primary)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Active Ticket Feed</h5>
              </div>

              {/* Category Filter */}
              <div className="d-flex align-items-center gap-2">
                <Filter size={14} style={{ color: "var(--text-muted)" }} />
                <select
                  className="form-select-v3"
                  style={{ minHeight: "36px", padding: "4px 10px", fontSize: "var(--text-xs)", width: "auto" }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {filtered.map((item) => {
                  const isResolved = item.status === "Resolved" || item.status === "Closed";
                  const isInProgress = item.status === "In Progress";
                  return (
                    <div
                      key={item._id}
                      style={{
                        padding: "var(--space-4)",
                        backgroundColor: "var(--bg-canvas)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "var(--text-sm)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {item.category}
                        </span>
                        <span
                          className={`badge-v3 ${
                            isResolved
                              ? "badge-success"
                              : isInProgress
                              ? "badge-info"
                              : "badge-warning"
                          }`}
                        >
                          {isResolved ? <CheckCircle size={12} /> : <Clock size={12} />}
                          <span>{item.status || "Open"}</span>
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--text-secondary)",
                          margin: "0 0 var(--space-2) 0",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.description || (item as any).message || "No description provided."}
                      </p>
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--text-muted)",
                          display: "block",
                        }}
                      >
                        Logged on {formatDate(item.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
                <Inbox size={40} className="mx-auto mb-2 opacity-40" />
                <h6 style={{ color: "var(--text-primary)", marginBottom: "4px" }}>
                  Zero Outstanding Tickets
                </h6>
                <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>
                  No complaints registered under category '{filterCategory}'.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintPage;
