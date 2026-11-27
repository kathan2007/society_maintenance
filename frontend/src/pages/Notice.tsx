import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
  Filter,
} from "lucide-react";
import apiClient from "../api/client";
import { formatDate } from "../utils";
import toast from "react-hot-toast";
import type { Notice } from "../types";

const NoticePage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");

  // Admin form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const role = localStorage.getItem("role");

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Notice[]>("/notice");
      setNotices(res.data || []);
    } catch (err) {
      toast.error("Failed to load society bulletins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || content.trim().length < 5) {
      toast.error("Title must be at least 3 chars, content at least 5 chars.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/notice", {
        title: title.trim(),
        content: content.trim(),
        priority,
      });
      setTitle("");
      setContent("");
      toast.success("Bulletin broadcasted to residents");
      fetchNotices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to publish notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this notice?")) return;
    try {
      await apiClient.delete(`/notice/${id}`);
      toast.success("Notice removed");
      fetchNotices();
    } catch (err) {
      toast.error("Failed to delete notice");
    }
  };

  const filtered = notices.filter(
    (n) => filterPriority === "all" || n.priority === filterPriority
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
          Society Bulletins & Official Notices
        </h1>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 0 }}>
          Direct broadcasts from the management committee regarding maintenance, meetings, and events.
        </p>
      </div>

      <div className="row g-4">
        {/* Admin Broadcast Card */}
        {role === "admin" && (
          <div className="col-lg-5">
            <div className="app-card">
              <div className="d-flex align-items-center gap-2 mb-4">
                <Plus size={20} style={{ color: "var(--accent)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Publish Official Bulletin</h5>
              </div>

              <form onSubmit={handleCreateNotice}>
                <div className="mb-3">
                  <label className="form-label-v3">Notice Subject</label>
                  <input
                    type="text"
                    className="form-control-v3"
                    placeholder="e.g. Water Pipeline Overhaul"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label-v3">Priority Level</label>
                  <select
                    className="form-select-v3"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="low">Standard / Low Priority</option>
                    <option value="medium">Important / Medium Priority</option>
                    <option value="high">Urgent / High Priority</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label-v3">Announcement Body</label>
                  <textarea
                    className="form-control-v3"
                    rows={4}
                    placeholder="Provide full schedule, affected towers, and instructions..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-gold w-100" disabled={submitting}>
                  <span>{submitting ? "Broadcasting..." : "Broadcast Notice"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notices Board */}
        <div className={role === "admin" ? "col-lg-7" : "col-12"}>
          <div className="app-card">
            {/* Filter Chips */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2">
                <Bell size={20} style={{ color: "var(--accent)" }} />
                <h5 style={{ margin: 0, fontWeight: 600 }}>Active Bulletins</h5>
              </div>

              <div className="d-flex align-items-center gap-2">
                <Filter size={14} style={{ color: "var(--text-muted)" }} />
                {["all", "high", "medium", "low"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFilterPriority(p)}
                    style={{
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 10px",
                      fontSize: "var(--text-xs)",
                      fontWeight: filterPriority === p ? 600 : 500,
                      backgroundColor: filterPriority === p ? "var(--accent)" : "var(--bg-canvas)",
                      color: filterPriority === p ? "var(--on-accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-5 text-center" style={{ color: "var(--text-muted)" }}>
                <div className="spinner-border text-primary mb-2" role="status" />
                <p style={{ fontSize: "var(--text-sm)" }}>Synchronizing notice board...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {filtered.map((notice) => (
                  <div
                    key={notice._id}
                    style={{
                      padding: "var(--space-4)",
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        {notice.priority === "high" ? (
                          <AlertTriangle size={18} style={{ color: "var(--danger)" }} />
                        ) : (
                          <Info size={18} style={{ color: "var(--primary)" }} />
                        )}
                        <h6 style={{ margin: 0, fontWeight: 600, fontSize: "var(--text-base)" }}>
                          {notice.title}
                        </h6>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className={`badge-v3 ${
                            notice.priority === "high"
                              ? "badge-danger"
                              : notice.priority === "medium"
                              ? "badge-warning"
                              : "badge-info"
                          }`}
                        >
                          {notice.priority}
                        </span>
                        {role === "admin" && (
                          <button
                            onClick={() => handleDeleteNotice(notice._id)}
                            title="Delete Notice"
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--danger)",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                        margin: "0 0 var(--space-2) 0",
                      }}
                    >
                      {notice.content}
                    </p>

                    <div className="d-flex align-items-center gap-2" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      <Calendar size={13} />
                      <span>Published {formatDate(notice.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
                <Bell size={40} className="mx-auto mb-2 opacity-40" />
                <h6 style={{ color: "var(--text-primary)", marginBottom: "4px" }}>No Bulletins Found</h6>
                <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>
                  There are no official bulletins matching filter '{filterPriority}'.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticePage;
