import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Plus, Trash2, Calendar, FileText,
  Search, Download, AlertCircle, CheckCircle, PieChart, TrendingDown,
  Shield, CreditCard, Loader2, MessageSquare
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

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/expense`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(res.data);
    } catch (err) {
      setError("Failed to sync financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !category) return setError("Mandatory protocol: All fields required");

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/expense`,
        { title, amount: Number(amount), category, date, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInfo("Expenditure committed to ledger.");
      setTitle(""); setAmount(""); setCategory(""); setDescription("");
      fetchExpenses();
    } catch (err) {
      setError("Encryption failed: Record not saved");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => { setInfo(""); setError(""); }, 4000);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Authorize permanent deletion of this record?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/expense/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInfo("Ledger entry purged.");
      fetchExpenses();
    } catch (err) {
      setError("Access Denied: Could not purge record");
    }
  };

  const downloadLedger = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SHREE HARI GIFT CITY FINANCIAL LEDGER", 15, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SHRI HARI GIFT CITY, NAVA NARODA, AHMEDABAD", 15, 30);
    doc.text(`Report Period: FY 2026-27 | Generated on: ${new Date().toLocaleDateString()}`, 15, 36);

    // Summary Section
    const totalOutflow = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("EXPENDITURE SUMMARY", 15, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Number of Records: ${expenses.length}`, 15, 62);
    doc.text(`Total Capital Outflow: INR ${totalOutflow.toLocaleString()}/-`, 15, 68);

    // Table
    const tableData = expenses.map(exp => [
      new Date(exp.date).toLocaleDateString(),
      exp.title,
      exp.category,
      `INR ${exp.amount.toLocaleString()}`,
      exp.addedBy?.name || "Admin"
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Date', 'Description', 'Category', 'Amount', 'Authorized By']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } }
    });

    doc.save("Society_Expense_Ledger.pdf");
  };

  const downloadExcel = () => {
    const dataToExport = expenses.map(exp => ({
      Date: new Date(exp.date).toLocaleDateString(),
      Description: exp.title,
      Category: exp.category,
      Amount: exp.amount,
      "Authorized By": exp.addedBy?.name || "Admin",
      Remarks: exp.description || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    
    // Set column widths
    const wscols = [
      { wch: 15 }, // Date
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 15 }, // Amount
      { wch: 20 }, // Authorized By
      { wch: 40 }  // Remarks
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "Society_Expenses.xlsx");
    setInfo("Excel ledger exported successfully.");
  };

  const shareOnWhatsApp = (expense: ExpenseType) => {
    const message = `*SHREE HARI GIFT CITY EXPENDITURE REPORT*%0A----------------------------%0A*Subject:* ${expense.title}%0A*Category:* ${expense.category}%0A*Amount:* ₹${expense.amount.toLocaleString()}%0A*Date:* ${new Date(expense.date).toLocaleDateString()}%0A----------------------------%0A*Instructions:* I have attached the official PDF receipt for this expenditure. Please check below.`;
    
    // Logic: Trigger individual PDF download first
    const doc = new jsPDF();
    doc.text("SHREE HARI GIFT CITY - EXPENDITURE RECEIPT", 10, 10);
    doc.text(`Subject: ${expense.title}`, 10, 20);
    doc.text(`Amount: INR ${expense.amount.toLocaleString()}`, 10, 30);
    doc.save(`Expense_${expense.title.replace(/\s+/g, '_')}.pdf`);
    
    // Then open WhatsApp
    setTimeout(() => {
        window.open(`https://wa.me/?text=${message}`, '_blank');
    }, 1000);
  };

  const filteredExpenses = expenses.filter(exp =>
    exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const uniqueCategoriesCount = Array.from(new Set(expenses.map(e => e.category))).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="page-container"
    >
      <div className="container-fluid px-md-4 py-4">

        {/* --- HEADER --- */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div className="d-flex align-items-center gap-4">
            <div className="icon-badge-blue">
              <DollarSign size={32} />
            </div>
            <div>
              <h1 className="fw-900 text-gradient mb-1">Society Ledger</h1>
              <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Financial Transparency & Resource Tracking</p>
            </div>
          </div>
          <div className="d-flex gap-3">
            <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={downloadExcel}
               className="btn-light border-1 px-4 py-3 rounded-3 d-flex align-items-center gap-2"
               style={{background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 800}}
            >
              <FileText size={20} className="text-success" /> Excel
            </motion.button>
            <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={downloadLedger}
               className="btn-light border-1 px-4 py-3 rounded-3 d-flex align-items-center gap-2"
               style={{background: '#f8fafc', border: '1px solid #e2e8f0', color: '#2563eb', fontWeight: 800}}
            >
              <Download size={20} className="text-primary" /> PDF
            </motion.button>
          </div>
        </div>

        {/* --- ALERTS --- */}
        <AnimatePresence>
          {(info || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className={`custom-alert mb-4 ${error ? 'alert-minimal-danger' : 'alert-minimal-blue'}`}
            >
              <div className="d-flex align-items-center gap-3">
                {error ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                <span className="fw-800 extra-small text-uppercase letter-spacing-1">{error || info}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="row g-4">
          {/* --- STATS SIDEBAR --- */}
          <div className="col-lg-3">
            <div className="d-flex flex-column gap-4">
              <div className="luxury-card p-4 border-start border-4 border-primary bg-white">
                <p className="extra-small text-muted fw-800 text-uppercase mb-2 letter-spacing-1">Total Outflow</p>
                <h2 className="fw-900 text-black mb-2">₹{totalExpenses.toLocaleString()}</h2>
                <div className="d-flex align-items-center gap-2 text-danger extra-small fw-900 uppercase">
                  <TrendingDown size={14} /> <span>Live Cycle</span>
                </div>
              </div>

              <div className="luxury-card p-4 border-start border-4 border-indigo bg-white" style={{borderColor: '#6366f1'}}>
                <p className="extra-small text-muted fw-800 text-uppercase mb-2 letter-spacing-1">Activity Nodes</p>
                <h2 className="fw-900 text-black mb-2">{uniqueCategoriesCount}</h2>
                <div className="d-flex align-items-center gap-2 text-primary extra-small fw-900 uppercase">
                  <PieChart size={14} /> <span>Distributed</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- FORM SECTION --- */}
          <div className="col-lg-9">
            {role === "admin" ? (
              <div className="luxury-card p-4 h-100 bg-white shadow-sm border-0">
                <h5 className="fw-900 text-black mb-4 d-flex align-items-center gap-3 uppercase letter-spacing-1">
                  <CreditCard size={24} className="text-primary" /> Record Expenditure
                </h5>
                <form onSubmit={handleAddExpense} className="row g-4">
                  <div className="col-md-3">
                    <label className="extra-small fw-900 text-black text-uppercase mb-2 d-block ms-1">Subject</label>
                    <input type="text" className="form-control py-3 rounded-3" placeholder="e.g. Lift Maintenance v2" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="col-md-3">
                    <label className="extra-small fw-900 text-black text-uppercase mb-2 d-block ms-1">Amount</label>
                    <div className="position-relative">
                       <input type="number" className="form-control py-3 rounded-3" placeholder="00.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <label className="extra-small fw-900 text-black text-uppercase mb-2 d-block ms-1">Type</label>
                    <select className="form-select py-3 rounded-3" value={category} onChange={(e) => setCategory(e.target.value)} required>
                      <option value="">Select...</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Security">Security</option>
                      <option value="Water">Water Supply</option>
                      <option value="Cleaning Service of the Society">Cleaning Service of the Society</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="extra-small fw-900 text-black text-uppercase mb-2 d-block ms-1">Date</label>
                    <input type="date" className="form-control py-3 rounded-3" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div className="col-md-9">
                    <label className="extra-small fw-900 text-black text-uppercase mb-2 d-block ms-1">Internal Notes</label>
                    <input type="text" className="form-control py-3 rounded-3" placeholder="Brief technical or financial details..." value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting} 
                      type="submit" 
                      className="btn-blue-solid w-100 py-3 rounded-3"
                    >
                      {isSubmitting ? <Loader2 size={24} className="animate-spin mx-auto" /> : "Authorize"}
                    </motion.button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="luxury-card p-5 d-flex flex-column align-items-center justify-content-center text-center bg-white shadow-sm border-0">
                <Shield size={48} className="text-primary opacity-20 mb-4" />
                <h5 className="text-black fw-900 uppercase">Verified Ledger Access</h5>
                <p className="extra-small text-muted fw-900 uppercase letter-spacing-1 mb-0">Live Audit Sync Enabled • Read Only Mode</p>
              </div>
            )}
          </div>

          {/* --- TABLE SECTION --- */}
          <div className="col-12">
            <div className="luxury-card p-0 overflow-hidden bg-white shadow-sm border-0">
              <div className="p-4 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <h5 className="fw-900 text-black mb-0 d-flex align-items-center gap-3 uppercase letter-spacing-1">
                  <FileText size={24} className="text-primary" /> Active Ledger
                </h5>
                <div className="search-box-light bg-light rounded-pill px-4">
                  <Search size={18} className="text-primary" />
                  <input
                    type="text"
                    className="border-0 bg-transparent py-2"
                    placeholder="Filter records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table mb-0 align-middle">
                  <thead>
                    <tr>
                      <th className="ps-4 py-4 text-muted extra-small fw-900 text-uppercase letter-spacing-1">Expense Date</th>
                      <th className="py-4 text-muted extra-small fw-900 text-uppercase letter-spacing-1">Description</th>
                      <th className="py-4 text-muted extra-small fw-900 text-uppercase letter-spacing-1">Category</th>
                      <th className="py-4 text-muted extra-small fw-900 text-uppercase letter-spacing-1">Investment</th>
                      <th className="py-4 text-muted extra-small fw-900 text-uppercase letter-spacing-1">Authorized</th>
                      {role === "admin" && <th className="text-end pe-4 py-4 text-muted extra-small fw-900 text-uppercase letter-spacing-1">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-5"><Loader2 size={48} className="animate-spin text-primary mx-auto" /></td></tr>
                    ) : filteredExpenses.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-5">
                         <div className="opacity-40 py-4">
                            <PieChart size={64} className="mx-auto mb-3" />
                            <p className="fw-800 extra-small text-uppercase text-black">No financial logs detected</p>
                         </div>
                      </td></tr>
                    ) : (
                      filteredExpenses.map((expense, idx) => (
                        <motion.tr 
                          key={expense._id} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <td className="ps-4 py-3">
                             <div className="d-flex flex-column">
                               <span className="fw-900 text-black small">{new Date(expense.date).toLocaleDateString()}</span>
                             </div>
                          </td>
                          <td>
                            <div className="fw-900 text-black mb-0 text-uppercase extra-small letter-spacing-1">{expense.title}</div>
                            <div className="extra-small text-muted fw-800">{expense.description || "System Approved Expenditure"}</div>
                          </td>
                          <td>
                            <span className="bg-light text-primary py-1 px-3 rounded-pill extra-small fw-900 uppercase" style={{fontSize: '0.65rem', border: '1px solid rgba(37,99,235,0.1)'}}>{expense.category}</span>
                          </td>
                          <td>
                            <span className="fw-900 text-black">₹{expense.amount.toLocaleString()}</span>
                          </td>
                          <td>
                             <span className="extra-small text-muted fw-900 uppercase letter-spacing-1">{expense.addedBy?.name || "Admin"}</span>
                          </td>
                          {role === "admin" && (
                            <td className="text-end pe-4 d-flex align-items-center justify-content-end gap-2">
                              <motion.button 
                                whileHover={{ scale: 1.1, color: '#25d366' }}
                                onClick={() => shareOnWhatsApp(expense)} 
                                className="btn border-0 text-muted transition-all p-2"
                                title="Share on WhatsApp"
                              >
                                <MessageSquare size={18} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1, color: '#f43f5e' }}
                                onClick={() => handleDeleteExpense(expense._id)} 
                                className="btn border-0 text-muted transition-all p-2"
                                title="Delete Record"
                              >
                                <Trash2 size={18} />
                              </motion.button>
                            </td>
                          )}
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Expenses;