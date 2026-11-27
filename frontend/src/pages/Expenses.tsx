import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, Plus, Trash2, Calendar, FileText,
  Search, Download, AlertCircle, CheckCircle,
  TrendingDown, Loader2, MessageSquare, IndianRupee,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExpenseType {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  addedBy: { name: string };
}

const CATEGORIES = ["Maintenance", "Electricity", "Security", "Water", "Cleaning Service of the Society", "Others"];

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/expense`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
    } catch {
      notify("Failed to load expense data", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !category) return notify("All fields are required", false);
    setIsSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/expense`,
        { title, amount: Number(amount), category, date, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notify("Expense recorded successfully");
      setTitle(""); setAmount(""); setCategory(""); setDescription("");
      setShowForm(false);
      fetchExpenses();
    } catch {
      notify("Failed to record expense", false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/expense/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notify("Expense deleted");
      fetchExpenses();
    } catch {
      notify("Failed to delete expense", false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(11, 27, 58);
    doc.rect(0, 0, 210, 38, "F");
    doc.setTextColor(201, 162, 75);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SHREE HARI GIFT CITY", 14, 18);
    doc.setTextColor(246, 243, 236);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Society Financial Ledger", 14, 27);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 33);

    const totalOutflow = expenses.reduce((s, e) => s + e.amount, 0);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Expenditure: ₹${totalOutflow.toLocaleString("en-IN")}`, 14, 50);

    autoTable(doc, {
      startY: 56,
      head: [["Date", "Description", "Category", "Amount (₹)", "By"]],
      body: expenses.map((exp) => [
        new Date(exp.date).toLocaleDateString("en-IN"),
        exp.title,
        exp.category,
        exp.amount.toLocaleString("en-IN"),
        exp.addedBy?.name || "Admin",
      ]),
      theme: "grid",
      headStyles: { fillColor: [11, 27, 58], textColor: [201, 162, 75], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 3: { halign: "right" } },
    });

    doc.save("Society_Expense_Ledger.pdf");
    notify("PDF downloaded");
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      expenses.map((exp) => ({
        Date: new Date(exp.date).toLocaleDateString("en-IN"),
        Description: exp.title,
        Category: exp.category,
        "Amount (₹)": exp.amount,
        "Authorized By": exp.addedBy?.name || "Admin",
        Remarks: exp.description || "",
      }))
    );
    ws["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "Society_Expenses.xlsx");
    notify("Excel exported");
  };

  const shareWhatsApp = (expense: ExpenseType) => {
    const msg = `*SHREE HARI GIFT CITY — Expense*%0A*Subject:* ${expense.title}%0A*Category:* ${expense.category}%0A*Amount:* ₹${expense.amount.toLocaleString("en-IN")}%0A*Date:* ${new Date(expense.date).toLocaleDateString("en-IN")}`;
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const filtered = expenses.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "var(--space-3) var(--space-4)",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-sm)",
    color: "var(--text-primary)",
    background: "var(--bg-canvas)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--weight-semibold)",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "var(--space-2)",
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
              background: "var(--accent-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-text)",
            }}
          >
            <Receipt size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", marginBottom: 2 }}>
              Society Ledger
            </h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
              Financial transparency & resource tracking
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {role === "admin" && (
            <button
              onClick={() => setShowForm((f) => !f)}
              className="btn-gold"
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
            >
              <Plus size={16} />
              {showForm ? "Cancel" : "Add Expense"}
            </button>
          )}
          <button
            onClick={downloadExcel}
            className="btn-outline-gold"
            style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
          >
            <FileText size={16} /> Excel
          </button>
          <button
            onClick={downloadPDF}
            className="btn-outline-gold"
            style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
          >
            <Download size={16} /> PDF
          </button>
        </div>
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

      {/* ── Summary Stat ── */}
      <div
        className="app-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-5)",
          padding: "var(--space-5) var(--space-6)",
          marginBottom: "var(--space-6)",
          background: "var(--bg-sidebar)",
          color: "var(--text-on-dark)",
        }}
      >
        <div style={{ padding: "var(--space-3)", background: "rgba(201,162,75,0.15)", borderRadius: "var(--radius-md)" }}>
          <TrendingDown size={24} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <div style={{ fontSize: "var(--text-xs)", color: "rgba(246,243,236,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Total Outflow
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", color: "var(--accent)", fontFamily: "var(--font-display)", lineHeight: 1 }}>
            ₹{totalExpenses.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "rgba(246,243,236,0.5)", marginTop: 4 }}>
            {expenses.length} records
          </div>
        </div>
      </div>

      {/* ── Add Expense Form ── */}
      <AnimatePresence>
        {showForm && role === "admin" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: "var(--space-6)" }}
          >
            <div className="app-card" style={{ padding: "var(--space-6)" }}>
              <h5 style={{ fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-5)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <IndianRupee size={18} style={{ color: "var(--accent)" }} />
                Record New Expense
              </h5>
              <form onSubmit={handleAddExpense}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
                  <div>
                    <label style={labelStyle}>Subject</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lift Maintenance" required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Amount (₹)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required style={inputStyle}>
                      <option value="">Select…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Notes (optional)</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details…" style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button type="submit" disabled={isSubmitting} className="btn-gold" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" }}>
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      {isSubmitting ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search + Table ── */}
      <div className="app-card" style={{ overflow: "hidden", padding: 0 }}>
        {/* Table Header with search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h6 style={{ fontWeight: "var(--weight-semibold)", margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <FileText size={16} style={{ color: "var(--accent)" }} />
            Expense Records
          </h6>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              background: "var(--bg-canvas)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-pill)",
              padding: "var(--space-2) var(--space-4)",
              minWidth: 220,
            }}
          >
            <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Filter records…"
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

        <div style={{ overflowX: "auto" }}>
          <table className="table-v3" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "var(--space-5)" }}>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Authorized By</th>
                {role === "admin" && <th style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>Actions</th>}
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
                      <Receipt size={48} style={{ opacity: 0.25, marginBottom: "var(--space-3)" }} />
                      <p style={{ fontWeight: "var(--weight-semibold)", maxWidth: "none" }}>No expense records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((expense, idx) => (
                  <motion.tr
                    key={expense._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    {/* Date */}
                    <td style={{ paddingLeft: "var(--space-5)", paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                        <Calendar size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        {new Date(expense.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>

                    {/* Description */}
                    <td>
                      <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                        {expense.title}
                      </div>
                      {expense.description && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                          {expense.description}
                        </div>
                      )}
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
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>

                    {/* Amount */}
                    <td>
                      <span style={{ fontWeight: "var(--weight-bold)", fontSize: "var(--text-base)", color: "var(--danger)" }}>
                        ₹{expense.amount.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Authorized By */}
                    <td>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                        {expense.addedBy?.name || "Admin"}
                      </span>
                    </td>

                    {/* Actions */}
                    {role === "admin" && (
                      <td style={{ textAlign: "right", paddingRight: "var(--space-5)" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                          <button
                            onClick={() => shareWhatsApp(expense)}
                            title="Share on WhatsApp"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              padding: "var(--space-2)",
                              borderRadius: "var(--radius-sm)",
                              display: "flex",
                              alignItems: "center",
                              transition: "color 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#25D366")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            title="Delete"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              padding: "var(--space-2)",
                              borderRadius: "var(--radius-sm)",
                              display: "flex",
                              alignItems: "center",
                              transition: "color 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
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

export default Expenses;
