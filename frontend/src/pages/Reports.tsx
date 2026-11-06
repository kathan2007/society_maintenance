import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Download, FileText, Calendar, Building, CheckCircle, PieChart, TrendingUp, TrendingDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface UserType {
  name: string;
  flatNo: string;
}

interface MaintenanceType {
  _id: string;
  amount: number;
  month: string;
  status: string;
  userId: UserType;
}

interface ExpenseType {
  _id: string;
  title: string;
  amount: number;
  date: string;
  category?: string;
}

const Reports: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceType[]>([]);
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [info, setInfo] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mntRes, expRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/maintenance?all=true`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/expense`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setMaintenance(mntRes.data);
        setExpenses(expRes.data);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if ((maintenance.length > 0 || expenses.length > 0) && !selectedMonth) {
      const allMonths = [
        ...maintenance.map(m => standardizeMonthFormat(m.month)),
        ...expenses.map(e => standardizeMonthFormat(typeof e.date === 'string' ? e.date.substring(0, 7) : e.date))
      ].filter(Boolean);
      const uniqueMonths = Array.from(new Set(allMonths)).sort().reverse();
      if (uniqueMonths.length > 0) setSelectedMonth(uniqueMonths[0]);
    }
  }, [maintenance, expenses, selectedMonth]);

  const standardizeMonthFormat = (mString: string) => {
    if (!mString) return "";
    if (mString.includes("-")) return mString;
    const parsed = new Date(`${mString} 1`);
    if (!isNaN(parsed.getTime())) {
      const mm = (parsed.getMonth() + 1).toString().padStart(2, '0');
      return `${parsed.getFullYear()}-${mm}`;
    }
    return mString;
  };

  const formatMonthDisplay = (mString: string) => {
    if (!mString) return "";
    if (mString.match(/^\d{4}-\d{2}$/)) {
      const [y, m] = mString.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1);
      return `${d.toLocaleString('default', { month: 'long' })} ${y}`;
    }
    return mString;
  };

  const getAvailableMonths = () => {
    const allMonths = [
      ...maintenance.map(m => standardizeMonthFormat(m.month)),
      ...expenses.map(e => standardizeMonthFormat(typeof e.date === 'string' ? e.date.substring(0, 7) : e.date))
    ].filter(Boolean);
    return Array.from(new Set(allMonths)).sort().reverse();
  };

  // Get filtered data for selected month (all blocks combined)
  const getMonthlyData = () => {
    const activeMonthFormat = standardizeMonthFormat(selectedMonth);
    const monthlyIncome = maintenance
      .filter(m => m.month === selectedMonth && m.status === "Paid")
      .sort((a, b) => {
        const flatA = a.userId?.flatNo || "";
        const flatB = b.userId?.flatNo || "";
        return flatA.localeCompare(flatB, undefined, { numeric: true });
      });
    const monthlyExpenses = expenses.filter(exp => {
      if (!exp.date) return false;
      const d = new Date(exp.date);
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const expMonth = `${d.getFullYear()}-${mm}`;
      return expMonth === activeMonthFormat;
    });
    const totalIncome = monthlyIncome.reduce((sum, m) => sum + m.amount, 0);
    const totalExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { monthlyIncome, monthlyExpenses, totalIncome, totalExpense, balance: totalIncome - totalExpense };
  };

  const generateReport = (format: "PDF" | "EXCEL") => {
    if (!selectedMonth) return setInfo("Please select a month for the report.");
    const { monthlyIncome, monthlyExpenses, totalIncome, totalExpense, balance } = getMonthlyData();
    if (format === "PDF") generatePDF(monthlyIncome, monthlyExpenses, totalIncome, totalExpense, balance);
    else generateExcel(monthlyIncome, monthlyExpenses, totalIncome, totalExpense, balance);
  };

  const generatePDF = (incomeData: MaintenanceType[], expenseData: ExpenseType[], totalIncome: number, totalExpense: number, balance: number) => {
    const doc = new jsPDF();
    const monthLabel = formatMonthDisplay(selectedMonth);

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SHREE GIFT CITY", 14, 16);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Financial Report — ${monthLabel}`, 14, 26);

    // Summary Boxes
    const summaryY = 45;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, summaryY, 55, 22, 3, 3, "F");
    doc.setTextColor(16, 185, 129);
    doc.text("TOTAL INCOME", 18, summaryY + 8);
    doc.setFontSize(13);
    doc.text(`Rs. ${totalIncome.toLocaleString()}`, 18, summaryY + 18);

    doc.setFillColor(254, 242, 242);
    doc.roundedRect(75, summaryY, 55, 22, 3, 3, "F");
    doc.setTextColor(244, 63, 94);
    doc.setFontSize(10);
    doc.text("TOTAL EXPENSE", 79, summaryY + 8);
    doc.setFontSize(13);
    doc.text(`Rs. ${totalExpense.toLocaleString()}`, 79, summaryY + 18);

    doc.setFillColor(balance >= 0 ? 219 : 254, balance >= 0 ? 234 : 202, balance >= 0 ? 254 : 202);
    doc.roundedRect(136, summaryY, 60, 22, 3, 3, "F");
    doc.setTextColor(balance >= 0 ? 109 : 220, balance >= 0 ? 40 : 38, balance >= 0 ? 217 : 38);
    doc.setFontSize(10);
    doc.text("NET BALANCE", 140, summaryY + 8);
    doc.setFontSize(13);
    doc.text(`Rs. ${balance.toLocaleString()}`, 140, summaryY + 18);

    // Income Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("INCOME — Maintenance Collected", 14, 80);

    const incomeRows = incomeData.map(inc => [
      inc.userId?.flatNo || "-",
      inc.userId?.name || "-",
      `Rs. ${inc.amount.toLocaleString()}`
    ]);
    incomeRows.push(["", "TOTAL INCOME", `Rs. ${totalIncome.toLocaleString()}`]);

    autoTable(doc, {
      startY: 84,
      head: [["Flat No", "Resident Name", "Amount"]],
      body: incomeRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fontStyle: 'bold' },
    });

    // Expense Table
    const expStartY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("EXPENSES", 14, expStartY);

    const expenseRows = expenseData.map(exp => [
      new Date(exp.date).toLocaleDateString('en-IN'),
      exp.title,
      exp.category || "-",
      `Rs. ${exp.amount.toLocaleString()}`
    ]);
    expenseRows.push(["", "", "TOTAL EXPENSE", `Rs. ${totalExpense.toLocaleString()}`]);
    expenseRows.push(["", "", "NET BALANCE", `Rs. ${balance.toLocaleString()}`]);

    autoTable(doc, {
      startY: expStartY + 4,
      head: [["Date", "Description", "Category", "Amount"]],
      body: expenseRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')} • SHREE GIFT CITY`, 14, 287);

    doc.save(`SHREE_GIFT_CITY_Report_${selectedMonth}.pdf`);
    setInfo("PDF Report Downloaded Successfully!");
    setTimeout(() => setInfo(""), 3000);
  };

  const generateExcel = (incomeData: MaintenanceType[], expenseData: ExpenseType[], totalIncome: number, totalExpense: number, balance: number) => {
    const wb = XLSX.utils.book_new();
    const monthLabel = formatMonthDisplay(selectedMonth);
    const aoaData: any[][] = [];

    aoaData.push(["SHREE GIFT CITY — Monthly Financial Report"]);
    aoaData.push([`Period: ${monthLabel}`]);
    aoaData.push([]);
    aoaData.push(["SUMMARY"]);
    aoaData.push(["Total Income", `Rs. ${totalIncome}`, "Total Expense", `Rs. ${totalExpense}`, "Net Balance", `Rs. ${balance}`]);
    aoaData.push([]);
    aoaData.push(["INCOME — Maintenance Collected"]);
    aoaData.push(["Flat No", "Resident Name", "Amount (Rs.)"]);
    incomeData.forEach(inc => {
      aoaData.push([inc.userId?.flatNo || "-", inc.userId?.name || "-", inc.amount]);
    });
    aoaData.push(["", "TOTAL INCOME", totalIncome]);
    aoaData.push([]);
    aoaData.push([]);
    aoaData.push(["EXPENSES"]);
    aoaData.push(["Date", "Description", "Category", "Amount (Rs.)"]);
    expenseData.forEach(exp => {
      aoaData.push([new Date(exp.date).toLocaleDateString('en-IN'), exp.title, exp.category || "-", exp.amount]);
    });
    aoaData.push(["", "", "TOTAL EXPENSE", totalExpense]);
    aoaData.push(["", "", "NET BALANCE", balance]);

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
    XLSX.writeFile(wb, `SHREE_GIFT_CITY_Report_${selectedMonth}.xlsx`);
    setInfo("Excel Report Downloaded Successfully!");
    setTimeout(() => setInfo(""), 3000);
  };

  const { totalIncome, totalExpense, balance, monthlyIncome, monthlyExpenses } = selectedMonth
    ? getMonthlyData()
    : { totalIncome: 0, totalExpense: 0, balance: 0, monthlyIncome: [], monthlyExpenses: [] };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="page-container">
      <div className="container-fluid px-md-4 py-4">

        {/* HEADER */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div className="d-flex align-items-center gap-4">
            <div className="icon-badge-blue">
              <PieChart size={32} />
            </div>
            <div>
              <h1 className="fw-900 text-gradient mb-1">SHREE GIFT CITY Monthly Report</h1>
              <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Income & Expense — PDF & Excel</p>
            </div>
          </div>
        </div>

        {info && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="custom-alert alert-minimal-blue mb-4">
            <CheckCircle size={20} className="me-2" /> <span className="fw-800 text-uppercase small">{info}</span>
          </motion.div>
        )}

        {/* MONTH SELECTOR */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-5">
            <div className="luxury-card p-4 bg-white border-0 shadow-sm">
              <h5 className="fw-900 text-black mb-3 d-flex align-items-center gap-2 text-uppercase letter-spacing-1">
                <Calendar size={20} className="text-primary" /> Select Report Period
              </h5>
              <select
                className="modern-select w-100 py-3 rounded-3"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Choose Month</option>
                {getAvailableMonths().map(m => (
                  <option key={m} value={m}>{formatMonthDisplay(m)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          {selectedMonth && (
            <div className="col-12 col-md-7">
              <div className="luxury-card p-4 bg-white border-0 shadow-sm h-100">
                <h5 className="fw-900 text-black mb-3 text-uppercase letter-spacing-1">Summary — {formatMonthDisplay(selectedMonth)}</h5>
                <div className="row g-3">
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#ecfdf5' }}>
                      <TrendingUp size={20} className="text-success mb-1" />
                      <p className="extra-small fw-900 text-muted text-uppercase mb-1">Income</p>
                      <p className="fw-900 text-success mb-0">₹{totalIncome.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#fef2f2' }}>
                      <TrendingDown size={20} className="text-danger mb-1" />
                      <p className="extra-small fw-900 text-muted text-uppercase mb-1">Expense</p>
                      <p className="fw-900 text-danger mb-0">₹{totalExpense.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: balance >= 0 ? '#ede9fe' : '#fef2f2' }}>
                      <Building size={20} style={{ color: balance >= 0 ? '#7c3aed' : '#ef4444' }} className="mb-1" />
                      <p className="extra-small fw-900 text-muted text-uppercase mb-1">Balance</p>
                      <p className="fw-900 mb-0" style={{ color: balance >= 0 ? '#7c3aed' : '#ef4444' }}>₹{balance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UNIFIED REPORT CARD */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="luxury-card p-5 bg-white border-0 shadow-sm border-bottom border-primary border-4">
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
                <div className="d-flex align-items-center gap-4">
                  <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-4" style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={36} />
                  </div>
                  <div>
                    <h3 className="fw-900 text-black text-uppercase letter-spacing-1 mb-1">SHREE GIFT CITY — All Blocks</h3>
                    <p className="text-muted extra-small fw-800 uppercase letter-spacing-2 mb-0">
                      {selectedMonth ? `${monthlyIncome.length} paid residents · ${monthlyExpenses.length} expenses` : "Select a month to preview data"}
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="btn-light border-1 px-5 py-3 rounded-3 fw-900 text-primary d-flex align-items-center gap-2"
                    onClick={() => generateReport("PDF")}
                    disabled={!selectedMonth}
                  >
                    <FileText size={20} /> Download PDF
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="btn-light border-1 px-5 py-3 rounded-3 fw-900 text-success d-flex align-items-center gap-2"
                    onClick={() => generateReport("EXCEL")}
                    disabled={!selectedMonth}
                  >
                    <Download size={20} /> Download Excel
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW TABLES */}
        {selectedMonth && (
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="luxury-card p-4 bg-white border-0 shadow-sm">
                <h6 className="fw-900 text-uppercase letter-spacing-1 text-success mb-3 d-flex align-items-center gap-2">
                  <TrendingUp size={16} /> Income ({monthlyIncome.length} records)
                </h6>
                {monthlyIncome.length === 0 ? (
                  <p className="text-muted text-center py-3 fw-800 extra-small">No paid records for this month</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead><tr><th className="extra-small fw-900 text-muted text-uppercase">Flat</th><th className="extra-small fw-900 text-muted text-uppercase">Name</th><th className="extra-small fw-900 text-muted text-uppercase text-end">Amount</th></tr></thead>
                      <tbody>
                        {monthlyIncome.map(m => (
                          <tr key={m._id}>
                            <td className="fw-800 small">{m.userId?.flatNo}</td>
                            <td className="fw-800 small">{m.userId?.name}</td>
                            <td className="fw-900 small text-end text-success">₹{m.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="table-success">
                          <td colSpan={2} className="fw-900 small text-uppercase">Total Income</td>
                          <td className="fw-900 small text-end text-success">₹{totalIncome.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-5">
              <div className="luxury-card p-4 bg-white border-0 shadow-sm">
                <h6 className="fw-900 text-uppercase letter-spacing-1 text-danger mb-3 d-flex align-items-center gap-2">
                  <TrendingDown size={16} /> Expenses ({monthlyExpenses.length} records)
                </h6>
                {monthlyExpenses.length === 0 ? (
                  <p className="text-muted text-center py-3 fw-800 extra-small">No expenses for this month</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead><tr><th className="extra-small fw-900 text-muted text-uppercase">Description</th><th className="extra-small fw-900 text-muted text-uppercase text-end">Amount</th></tr></thead>
                      <tbody>
                        {monthlyExpenses.map(e => (
                          <tr key={e._id}>
                            <td className="fw-800 small">{e.title}</td>
                            <td className="fw-900 small text-end text-danger">₹{e.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="table-danger">
                          <td className="fw-900 small text-uppercase">Total Expense</td>
                          <td className="fw-900 small text-end text-danger">₹{totalExpense.toLocaleString()}</td>
                        </tr>
                        <tr className="table-secondary">
                          <td className="fw-900 small text-uppercase">Net Balance</td>
                          <td className={`fw-900 small text-end ${balance >= 0 ? 'text-success' : 'text-danger'}`}>₹{balance.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default Reports;
