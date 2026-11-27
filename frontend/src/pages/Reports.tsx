import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../api/client";
import { motion } from "framer-motion";
import { Download, FileText, Calendar, Building, CheckCircle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface UserType { name: string; flatNo: string }
interface MaintenanceType { _id: string; amount: number; month: string; status: string; userId: UserType }
interface ExpenseType { _id: string; title: string; amount: number; date: string; category?: string }

const Reports: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceType[]>([]);
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [toast, setToast] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mntRes, expRes] = await Promise.all([
        apiClient.get<MaintenanceType[]>("/maintenance"),
        apiClient.get<ExpenseType[]>("/expense"),
      ]);
      setMaintenance(mntRes.data || []);
      setExpenses(expRes.data || []);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stdMonth = (s: string) => {
    if (!s) return "";
    if (s.includes("-")) return s.substring(0, 7);
    const p = new Date(`${s} 1`);
    if (!isNaN(p.getTime())) return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}`;
    return s;
  };

  const fmtMonth = (s: string) => {
    if (!s) return "";
    if (s.match(/^\d{4}-\d{2}$/)) {
      const [y, m] = s.split("-");
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleString("default", { month: "long", year: "numeric" });
    }
    return s;
  };

  // Generate available months: always include current month and past 11 months + any recorded months
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();

    // 1. Add current and past 11 months so user can always choose any month even before data exists
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsSet.add(mStr);
    }

    // 2. Add any months present in maintenance or expenses
    maintenance.forEach((m) => {
      const sm = stdMonth(m.month);
      if (sm) monthsSet.add(sm);
    });
    expenses.forEach((e) => {
      const sm = stdMonth(e.date?.substring(0, 7) || "");
      if (sm) monthsSet.add(sm);
    });

    return Array.from(monthsSet).sort().reverse();
  }, [maintenance, expenses]);

  // Set default selection to current month or first available
  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if (availableMonths.includes(currentMonthStr)) {
        setSelectedMonth(currentMonthStr);
      } else {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [availableMonths, selectedMonth]);

  const getMonthlyData = () => {
    const monthlyIncome = maintenance
      .filter((m) => stdMonth(m.month) === selectedMonth && m.status === "Paid")
      .sort((a, b) => (a.userId?.flatNo || "").localeCompare(b.userId?.flatNo || "", undefined, { numeric: true }));
    const monthlyExpenses = expenses.filter((e) => {
      if (!e.date) return false;
      return e.date.substring(0, 7) === selectedMonth;
    });
    const totalIncome = monthlyIncome.reduce((s, m) => s + m.amount, 0);
    const totalExpense = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
    return { monthlyIncome, monthlyExpenses, totalIncome, totalExpense, balance: totalIncome - totalExpense };
  };

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const generatePDF = () => {
    if (!selectedMonth) return notify("Select a month first");
    const { monthlyIncome, monthlyExpenses, totalIncome, totalExpense, balance } = getMonthlyData();
    const doc = new jsPDF();
    doc.setFillColor(11, 27, 58);
    doc.rect(0, 0, 210, 36, "F");
    doc.setTextColor(201, 162, 75);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SHREE HARI GIFT CITY", 14, 16);
    doc.setTextColor(246, 243, 236);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Financial Report — ${fmtMonth(selectedMonth)}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 32);

    // Summary
    const sy = 44;
    const boxes = [
      { label: "INCOME", value: totalIncome, fillColor: [221, 243, 228] as [number,number,number], textColor: [20, 98, 58] as [number,number,number] },
      { label: "EXPENSE", value: totalExpense, fillColor: [251, 225, 228] as [number,number,number], textColor: [163, 34, 51] as [number,number,number] },
      { label: "BALANCE", value: balance, fillColor: balance >= 0 ? [221, 243, 228] as [number,number,number] : [251, 225, 228] as [number,number,number], textColor: balance >= 0 ? [20, 98, 58] as [number,number,number] : [163, 34, 51] as [number,number,number] },
    ];
    boxes.forEach((box, i) => {
      doc.setFillColor(...box.fillColor);
      doc.roundedRect(14 + i * 65, sy, 60, 20, 3, 3, "F");
      doc.setTextColor(...box.textColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(box.label, 18 + i * 65, sy + 7);
      doc.setFontSize(12);
      doc.text(`₹${box.value.toLocaleString("en-IN")}`, 18 + i * 65, sy + 16);
    });

    autoTable(doc, {
      startY: sy + 28,
      head: [["Flat", "Resident", "Amount"]],
      body: [
        ...monthlyIncome.map((m) => [m.userId?.flatNo || "-", m.userId?.name || "-", `₹${m.amount.toLocaleString("en-IN")}`]),
        ["", "TOTAL INCOME", `₹${totalIncome.toLocaleString("en-IN")}`],
      ],
      headStyles: { fillColor: [20, 98, 58], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });

    const expStart = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Expenses", 14, expStart);
    autoTable(doc, {
      startY: expStart + 4,
      head: [["Date", "Description", "Category", "Amount"]],
      body: [
        ...monthlyExpenses.map((e) => [new Date(e.date).toLocaleDateString("en-IN"), e.title, e.category || "-", `₹${e.amount.toLocaleString("en-IN")}`]),
        ["", "", "TOTAL EXPENSE", `₹${totalExpense.toLocaleString("en-IN")}`],
        ["", "", "NET BALANCE", `₹${balance.toLocaleString("en-IN")}`],
      ],
      headStyles: { fillColor: [163, 34, 51], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });

    doc.save(`SHREE_GIFT_CITY_Report_${selectedMonth}.pdf`);
    notify("PDF downloaded");
  };

  const generateExcel = () => {
    if (!selectedMonth) return notify("Select a month first");
    const { monthlyIncome, monthlyExpenses, totalIncome, totalExpense, balance } = getMonthlyData();
    const wb = XLSX.utils.book_new();
    const aoa: any[][] = [
      [`SHREE HARI GIFT CITY — Monthly Report: ${fmtMonth(selectedMonth)}`],
      [],
      ["SUMMARY"],
      ["Total Income", `₹${totalIncome}`, "Total Expense", `₹${totalExpense}`, "Net Balance", `₹${balance}`],
      [],
      ["INCOME"],
      ["Flat", "Resident", "Amount"],
      ...monthlyIncome.map((m) => [m.userId?.flatNo || "-", m.userId?.name || "-", m.amount]),
      ["", "TOTAL INCOME", totalIncome],
      [],
      ["EXPENSES"],
      ["Date", "Description", "Category", "Amount"],
      ...monthlyExpenses.map((e) => [new Date(e.date).toLocaleDateString("en-IN"), e.title, e.category || "-", e.amount]),
      ["", "", "TOTAL EXPENSE", totalExpense],
      ["", "", "NET BALANCE", balance],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `SHREE_GIFT_CITY_Report_${selectedMonth}.xlsx`);
    notify("Excel downloaded");
  };

  const { totalIncome, totalExpense, balance, monthlyIncome, monthlyExpenses } =
    selectedMonth ? getMonthlyData() : { totalIncome: 0, totalExpense: 0, balance: 0, monthlyIncome: [], monthlyExpenses: [] };

  const statCardBase: React.CSSProperties = {
    padding: "var(--space-5)",
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
    flex: "1 1 140px",
  };

  const thStyle: React.CSSProperties = {
    padding: "var(--space-3) var(--space-4)",
    textAlign: "left",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--weight-semibold)",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    background: "var(--bg-canvas)",
    borderBottom: "1px solid var(--border)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "var(--space-3) var(--space-4)",
    fontSize: "var(--text-sm)",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border)",
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
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: "var(--radius-md)",
            background: "var(--accent-light)", display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--accent-text)",
          }}
        >
          <FileText size={24} />
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", marginBottom: 2 }}>
            Monthly Reports
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
            Income & expense — PDF & Excel export
          </p>
        </div>
      </div>

      {toast && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-5)", borderRadius: "var(--radius-md)", background: "var(--success-bg)", color: "var(--success)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-4)", border: "1px solid var(--success)" }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* ── Month Selector + Summary ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-5)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        {/* Selector */}
        <div className="app-card" style={{ padding: "var(--space-5)" }}>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Calendar size={14} /> Select Period
          </label>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3) 0", color: "var(--text-muted)" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "var(--text-sm)" }}>Loading periods...</span>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-3) var(--space-4)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-surface)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Choose month…</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {fmtMonth(m)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {selectedMonth && (
          <div className="app-card" style={{ padding: "var(--space-5)" }}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-4)" }}>
              Summary — {fmtMonth(selectedMonth)}
            </div>
            <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <div style={{ ...statCardBase, background: "var(--success-bg)" }}>
                <TrendingUp size={18} style={{ color: "var(--success)", marginBottom: "var(--space-2)" }} />
                <div style={{ fontSize: "var(--text-xs)", color: "var(--success)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-1)" }}>Income</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--success)" }}>₹{totalIncome.toLocaleString("en-IN")}</div>
              </div>
              <div style={{ ...statCardBase, background: "var(--danger-bg)" }}>
                <TrendingDown size={18} style={{ color: "var(--danger)", marginBottom: "var(--space-2)" }} />
                <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-1)" }}>Expense</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--danger)" }}>₹{totalExpense.toLocaleString("en-IN")}</div>
              </div>
              <div style={{ ...statCardBase, background: balance >= 0 ? "var(--success-bg)" : "var(--danger-bg)" }}>
                <Building size={18} style={{ color: balance >= 0 ? "var(--success)" : "var(--danger)", marginBottom: "var(--space-2)" }} />
                <div style={{ fontSize: "var(--text-xs)", color: balance >= 0 ? "var(--success)" : "var(--danger)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-1)" }}>Balance</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: balance >= 0 ? "var(--success)" : "var(--danger)" }}>₹{balance.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Download Card ── */}
      {selectedMonth && (
        <div
          className="app-card"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            padding: "var(--space-5) var(--space-6)",
            marginBottom: "var(--space-6)",
            borderLeft: "4px solid var(--accent)",
          }}
        >
          <div>
            <h5 style={{ fontWeight: "var(--weight-semibold)", marginBottom: 4 }}>
              Shree Hari Gift City — {fmtMonth(selectedMonth)}
            </h5>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
              {monthlyIncome.length} paid residents · {monthlyExpenses.length} expense records
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button onClick={generatePDF} className="btn-gold" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <FileText size={16} /> PDF
            </button>
            <button onClick={generateExcel} className="btn-outline-gold" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Download size={16} /> Excel
            </button>
          </div>
        </div>
      )}

      {/* ── Preview Tables ── */}
      {selectedMonth && (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "var(--space-5)" }}>
          {/* Income table */}
          <div className="app-card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <TrendingUp size={16} style={{ color: "var(--success)" }} />
              <h6 style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>Income — {monthlyIncome.length} paid</h6>
            </div>
            {monthlyIncome.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "var(--space-8)", fontSize: "var(--text-sm)" }}>
                No paid records for this month
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Flat</th>
                    <th style={thStyle}>Resident</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyIncome.map((m) => (
                    <tr key={m._id}>
                      <td style={tdStyle}>{m.userId?.flatNo}</td>
                      <td style={tdStyle}>{m.userId?.name}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: "var(--weight-semibold)", color: "var(--success)" }}>
                        ₹{m.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--success-bg)" }}>
                    <td colSpan={2} style={{ ...tdStyle, fontWeight: "var(--weight-bold)", color: "var(--success)" }}>Total Income</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "var(--weight-bold)", color: "var(--success)" }}>
                      ₹{totalIncome.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Expense table */}
          <div className="app-card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <TrendingDown size={16} style={{ color: "var(--danger)" }} />
              <h6 style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>Expenses — {monthlyExpenses.length} records</h6>
            </div>
            {monthlyExpenses.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "var(--space-8)", fontSize: "var(--text-sm)" }}>
                No expenses this month
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Description</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyExpenses.map((e) => (
                    <tr key={e._id}>
                      <td style={tdStyle}>{e.title}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: "var(--weight-semibold)", color: "var(--danger)" }}>
                        ₹{e.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--danger-bg)" }}>
                    <td style={{ ...tdStyle, fontWeight: "var(--weight-bold)", color: "var(--danger)" }}>Total Expense</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "var(--weight-bold)", color: "var(--danger)" }}>
                      ₹{totalExpense.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr style={{ background: balance >= 0 ? "var(--success-bg)" : "var(--danger-bg)" }}>
                    <td style={{ ...tdStyle, fontWeight: "var(--weight-bold)", color: balance >= 0 ? "var(--success)" : "var(--danger)" }}>Net Balance</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "var(--weight-bold)", color: balance >= 0 ? "var(--success)" : "var(--danger)" }}>
                      ₹{balance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!selectedMonth && !loading && (
        <div className="app-card" style={{ textAlign: "center", padding: "var(--space-12) var(--space-6)", color: "var(--text-muted)" }}>
          <Calendar size={48} style={{ opacity: 0.25, marginBottom: "var(--space-4)" }} />
          <h5 style={{ fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>Select a month to view data</h5>
          <p style={{ maxWidth: "none", fontSize: "var(--text-sm)" }}>
            {availableMonths.length === 0 ? "No data available yet" : `${availableMonths.length} months available`}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Reports;
