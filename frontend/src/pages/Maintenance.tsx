import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UpiQrModal from "../components/payment/UpiQrModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, CheckCircle, Plus,
  FileText, Share2, Search, AlertCircle, Loader2, X, Download, MessageSquare, ShieldCheck, Clock, QrCode, Smartphone
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { io } from "socket.io-client";
import API_BASE_URL from "../config/api";

const socket = io(API_BASE_URL);

interface MaintenanceType {
  _id: string;
  amount: number;
  penalty?: number;
  totalAmount?: number;
  month: string;
  status: string;
  transactionId?: string;
  updatedAt?: string;
  userId?: { name: string; flatNo: string; phoneNumber?: string; category?: string };
}

const Maintenance: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MaintenanceType[]>([]);
  const [month, setMonth] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);

  const [collectedModal, setCollectedModal] = useState<MaintenanceType | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState({ ownerMaintenanceAmount: 0, rentMaintenanceAmount: 0, penaltyAmount: 0 });

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userCategory = localStorage.getItem("category") || "owner";

  const fetchData = async () => {
    try {
      const url = role === "admin" ? `${API_BASE_URL}/maintenance?all=true` : `${API_BASE_URL}/maintenance`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) { console.log("Settings fetch error", err); }
  };

  const triggerWhatsAppShare = (item: MaintenanceType) => {
    if (!item?.userId?.phoneNumber) return;
    
    const formattedMonth = formatMonth(item.month);
    const message = `*SHREE HARI GIFT CITY OFFICIAL RECEIPT*%0A----------------------------%0A*Resident:* ${item.userId?.name}%0A*Flat No:* ${item.userId?.flatNo}%0A*Month:* ${formattedMonth}%0A*Amount:* ₹${item.amount.toLocaleString()}%0A*Status:* PAID SUCCESSFULLY ✅%0A*Ref ID:* ${item.transactionId}%0A----------------------------%0A*Instructions:* Please download the PDF from the portal and attach it to this chat for your records.`;
    const cleanPhone = item.userId.phoneNumber.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const createMaintenance = async () => {
    if (!month) return setInfo("Please choose a billing period");
    const existing = data.find(item => item.month === month && (role === "admin" || (item.userId as any)?.userId === localStorage.getItem("userId") || (item.userId as any)?._id === localStorage.getItem("userId")));
    if (existing && role !== "admin") {
       payMaintenance(existing);
       return;
    }
    if (role === "user") {
      const baseAmount = userCategory === "rent" ? settings.rentMaintenanceAmount : settings.ownerMaintenanceAmount;
      let calcPenalty = 0;
      const today = new Date();
      today.setHours(0,0,0,0);
      const mStart = new Date(month + "-01");
      if(!isNaN(mStart.getTime())) {
         const dueDate = new Date(mStart.getFullYear(), mStart.getMonth(), 15);
         if(today > dueDate) {
            calcPenalty = settings.penaltyAmount || 0;
         }
      }

      try {
        setProcessingId("init-payment");
        // Persist the pending record so admin can see it and mark it paid
        console.log("Creating/Updating bill for month:", month);
        const res = await axios.post(`${API_BASE_URL}/maintenance/user`, 
          { amount: baseAmount, month, transactionId: "PENDING", penalty: calcPenalty, status: "Pending" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const newRecord = res.data.maintenance || res.data;
        payMaintenance(newRecord);
        fetchData();
      } catch (err) {
        setInfo("Error initiating checkout.");
      } finally {
        setProcessingId(null);
      }
      return;
    }
    try {
      setProcessingId("gen-bills");
      const res = await axios.post(`${API_BASE_URL}/maintenance`, { month }, { headers: { Authorization: `Bearer ${token}` } });
      setInfo(res.data.message || "Bills generated!");
      setMonth("");
      fetchData();
    } catch (err) {
      setInfo("Error generating bills.");
    } finally {
      setProcessingId(null);
      setTimeout(() => setInfo(""), 5000);
    }
  };

  const formatMonth = (m: string) => {
    if (!m || !m.includes('-')) return m;
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const payMaintenance = async (item: MaintenanceType) => {
    if (!token) return setInfo("Error: Not logged in.");
    if (!item?._id) return setInfo("Error: Maintenance record invalid.");

    try {
      setProcessingId(item._id);
      const amount = item.totalAmount || item.amount;
      
      const res = await axios.post(`${API_BASE_URL}/api/payment/create-order`, 
        { amount, maintenanceId: item._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setInfo("Order created! Opening QR...");
        console.log("Setting current order:", res.data);
        setCurrentOrder(res.data);
        setShowQrModal(true);
        setTimeout(() => setInfo(""), 2000);
      } else {
        setInfo("Error: Failed to create order record.");
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      const backendMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setInfo(`Payment Gateway Message: ${backendMsg}`);
    } finally {
      setProcessingId(null);
    }
  };

  const markCollected = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await axios.put(`${API_BASE_URL}/maintenance/${id}`,
        { status: "Paid", transactionId: `CASH-${Math.floor(Math.random() * 1000000)}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInfo("Payment recorded.");
      fetchData();
    } catch (err) { setInfo("Error updating status."); } 
    finally { setProcessingId(null); setTimeout(() => setInfo(""), 5000); }
  };

  const downloadReceipt = (item: MaintenanceType) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont("helvetica", "bold");
    doc.text("SHREE HARI GIFT CITY PORTAL", 20, 20);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("SHRI HARI GIFT CITY, NAVA NARODA, AHMEDABAD", 20, 28);
    doc.text("Official Maintenance Receipt • Secure Logic", 20, 34);
    doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("TRANSACTION SUMMARY", 20, 55);
    autoTable(doc, {
        startY: 65, head: [['Field', 'Information Details']],
        body: [
            ['Resident Name', item.userId?.name || "Member"],
            ['Flat / Unit Number', item.userId?.flatNo || "N/A"],
            ['Resident Type', (item.userId?.category || "Owner").toUpperCase()],
            ['Billing Month', formatMonth(item.month)],
            ['Base Amount', `INR ${item.amount.toLocaleString()}/-`],
            ['Late Penalty Applied', `INR ${(item.penalty || 0).toLocaleString()}/-`],
            ['Total Amount Paid', `INR ${(item.totalAmount || item.amount).toLocaleString()}/-`],
            ['Payment Date', item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-GB') : 'N/A'],
            ['Transaction Status', 'SUCCESS / PAID'],
            ['Transaction ID', item.transactionId || "INTERNAL-CASH"]
        ],
        theme: 'grid', headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 }
    });
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Digitally Verified Signature", 20, finalY);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text("This is a computer-generated receipt and does not require a physical stamp.", 20, finalY + 10);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 20, finalY + 16);
    doc.save(`Receipt_${item.month}_${item.userId?.flatNo}.pdf`);
  };

  const filteredData = data.filter(d => {
    const matchesStatus = filterStatus === "All" || d.status === filterStatus;
    const matchesSearch = d.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.userId?.flatNo?.toLowerCase().includes(searchTerm.toLowerCase()) || d.month.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="page-container">
      <div className="container-fluid px-md-4 py-4">
        {/* --- HEADER --- */}
        <div className="mb-5 d-flex align-items-center gap-4">
          <div className="icon-badge-blue"><Wallet size={32} /></div>
          <div><h1 className="fw-900 text-gradient mb-1">Society Finance</h1><p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Secure Ledger & Automated Dues Tracking</p></div>
        </div>
        <AnimatePresence>
          {info && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="custom-alert alert-minimal-blue mb-4">
              <div className="d-flex align-items-center gap-3"><CheckCircle size={20} /><span className="fw-800 extra-small text-uppercase letter-spacing-1">{info}</span></div>
              <X size={20} className="cursor-pointer opacity-50" onClick={() => setInfo("")} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="row g-4">
          <div className="col-12"><div className="luxury-card p-4"><div className="row align-items-center g-4"><div className="col-lg-8"><h5 className="fw-900 text-gradient mb-4 d-flex align-items-center gap-3"><Plus size={24} className="text-primary" />{role === "admin" ? "Generate Society Bills" : "Instant Dues Settlement"}</h5><div className="row g-3"><div className="col-md-5"><label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Billing Period</label><input type="month" className="modern-input w-100" value={month} onChange={(e) => setMonth(e.target.value)} /></div><div className="col-md-7 d-flex align-items-end"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-blue-solid w-100 py-3" onClick={createMaintenance} disabled={!!processingId}>{processingId === "gen-bills" ? <Loader2 size={24} className="animate-spin" /> : (role === "admin" ? "Initialize Monthly Dues" : "View & Pay Dues")}</motion.button></div></div></div><div className="col-lg-4 d-none d-lg-flex justify-content-center"><div className="opacity-10"><QrCode size={120} className="text-primary" /></div></div></div></div></div>
          <div className="col-12">
            <div className="luxury-card p-0 overflow-hidden">
              <div className="p-4 border-bottom border-glass d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"><h5 className="fw-900 text-gradient mb-0">Transaction Records</h5><div className="d-flex gap-3"><div className="search-box-light"><Search size={18} className="text-primary" /><input type="text" placeholder="Search report..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ color: '#000000', fontWeight: '800' }} /></div><select className="modern-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="All">All Transactions</option><option value="Pending">Pending Dues</option><option value="Paid">Processed</option></select></div></div>
              <div className="table-responsive">
                <table className="table mb-0 align-middle">
                  <thead><tr><th className="ps-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Apartment</th><th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Resident</th><th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Billing Period</th><th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Amount</th><th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Status</th><th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Paid On</th><th className="text-end pe-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Action</th></tr></thead>
                  <tbody>{loading ? (<tr><td colSpan={7} className="text-center py-5"><Loader2 size={48} className="animate-spin text-primary mx-auto" /></td></tr>) : filteredData.length === 0 ? (<tr><td colSpan={7} className="text-center py-5"><div className="opacity-40 py-4"><FileText size={48} className="mx-auto mb-3" /><p className="fw-800 extra-small text-uppercase">No financial records found</p></div></td></tr>) : (filteredData.map((item) => (
                    <tr key={item._id}>
                      <td className="ps-4 py-3 fw-900 text-primary font-monospace">{item.userId?.flatNo || "N/A"}<div className="extra-small text-muted opacity-60 text-uppercase">{item.userId?.category || "Owner"}</div></td>
                      <td className="fw-900 text-secondary">{item.userId?.name || "System Base"}</td>
                      <td className="text-muted small fw-800 text-uppercase">{formatMonth(item.month)}</td>
                      <td className="fw-900 text-secondary">
                        <div className="d-flex flex-column">
                          <span>₹{(item.totalAmount || item.amount).toLocaleString()}</span>
                          {item.penalty ? <span className="text-danger" style={{fontSize: '0.65rem'}}>Penalty: ₹{item.penalty.toLocaleString()}</span> : null}
                        </div>
                      </td>
                      <td><span className={item.status === 'Paid' ? 'pill-success' : 'pill-warning'}>{item.status}</span></td>
                      <td className="text-muted extra-small fw-900 uppercase">
                        {item.status === 'Paid' && item.updatedAt ? (
                          <div className="d-flex flex-column">
                            <span>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</span>
                            <span style={{fontSize: '0.65rem'}} className="opacity-60 mb-1">{new Date(item.updatedAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="text-primary font-monospace" style={{fontSize: '0.6rem'}}>{item.transactionId}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="text-end pe-4">
                        {item.status === "Pending" ? (
                          <div className="d-flex gap-2 justify-content-end">
                            {role === 'admin' ? (
                              <motion.button 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }} 
                                className="btn-light-sm border-1" 
                                style={{fontSize: '0.65rem', fontWeight: 900}} 
                                onClick={() => markCollected(item._id)}
                              >
                                 {processingId === item._id ? <Loader2 size={16} className="animate-spin" /> : "Mark Paid"}
                              </motion.button>
                            ) : (
                              <motion.button 
                                whileHover={{ scale: 1.05, y: -2 }} 
                                whileTap={{ scale: 0.95 }} 
                                className="btn-pay-dues" 
                                onClick={() => payMaintenance(item)}
                              >
                                {processingId === item._id ? (
                                  <Loader2 size={16} className="animate-spin text-white" />
                                ) : (
                                  <div className="d-flex align-items-center gap-2">
                                    <QrCode size={16} className="opacity-80" />
                                    <span>Pay Now</span>
                                  </div>
                                )}
                              </motion.button>
                            )}
                          </div>
                        ) : (
                          <div className="d-flex justify-content-end gap-2">
                            <motion.button whileHover={{ scale: 1.1 }} className="icon-badge-blue" style={{width: '36px', height: '36px', borderRadius: '10px'}} onClick={() => setCollectedModal(item)}>
                              <div className="text-white d-flex align-items-center justify-content-center"><Download size={16} /></div>
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} className="icon-badge-blue" style={{width: '36px', height: '36px', borderRadius: '10px', background: '#25d366'}} onClick={() => { downloadReceipt(item); setTimeout(() => triggerWhatsAppShare(item), 1000); }}>
                              <div className="text-white d-flex align-items-center justify-content-center"><MessageSquare size={16} /></div>
                            </motion.button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {collectedModal && (
            <div className="modal-overlay" onClick={() => { setCollectedModal(null); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="modal-content-custom" onClick={e => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-5">
                  <h5 className="fw-900 text-gradient mb-0">Payment Insight</h5>
                  <X size={24} className="cursor-pointer text-muted" onClick={() => { setCollectedModal(null); }} />
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-4 bg-light border mb-4">
                    <div className="bg-success text-white mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}><CheckCircle size={32} /></div>
                    <h2 className="fw-900 text-black mb-1">₹{collectedModal.amount}</h2>
                    <p className="text-success extra-small fw-900 text-uppercase letter-spacing-1">Verified Inflow</p>
                  </div>
                  <div className="text-start mb-5 d-flex flex-column gap-3 p-3 bg-light rounded-3">
                    <div className="d-flex justify-content-between extra-small"><span className="fw-800 text-muted uppercase">Transaction ID</span><span className="fw-900 text-secondary font-monospace">{collectedModal.transactionId}</span></div>
                    <div className="d-flex justify-content-between extra-small"><span className="fw-800 text-muted uppercase">Resident</span><span className="fw-900 text-secondary">{collectedModal.userId?.name}</span></div>
                    <div className="d-flex justify-content-between extra-small"><span className="fw-800 text-muted uppercase">Apt Unit</span><span className="fw-900 text-primary">{collectedModal.userId?.flatNo}</span></div>
                    <div className="d-flex justify-content-between extra-small"><span className="fw-800 text-muted uppercase">Paid Date</span><span className="fw-900 text-secondary">{collectedModal.updatedAt ? new Date(collectedModal.updatedAt).toLocaleString('en-GB') : 'N/A'}</span></div>
                  </div>
                  <div className="d-grid gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-blue-solid py-3 d-flex align-items-center justify-content-center gap-2" onClick={() => downloadReceipt(collectedModal)}><Download size={20} /> Download PDF Receipt</motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-light border-1 py-3 d-flex align-items-center justify-content-center gap-2" style={{background: '#f8fafc', border: '1px solid #e2e8f0', color: '#25d366', fontWeight: 900}} onClick={() => { downloadReceipt(collectedModal); setTimeout(() => triggerWhatsAppShare(collectedModal), 1000); }}><Share2 size={20} /> Share as PDF on WhatsApp</motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <UpiQrModal 
           isOpen={showQrModal} 
           onClose={() => setShowQrModal(false)} 
           order={currentOrder}
           onSuccess={() => {
              setInfo("Payment confirmed! Record updated.");
              fetchData();
              setTimeout(() => setInfo(""), 5000);
           }}
        />
        <style>{`
          .btn-pay-dues {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 12px;
            border: none;
            font-size: 0.75rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.2);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .btn-pay-dues:hover {
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
            filter: brightness(1.1);
          }
        `}</style>
      </div>
    </motion.div>
  );
};

export default Maintenance;