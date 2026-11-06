import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { History, CheckCircle, XCircle, Clock, Search, FileText, Loader2, IndianRupee } from "lucide-react";

interface OrderType {
  _id: string;
  orderId: string;
  amount: number;
  status: string;
  paymentId?: string;
  createdAt: string;
}

const PaymentHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/payment/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error("History fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const filteredOrders = orders.filter(o => 
    o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusPill = (status: string) => {
    switch (status) {
      case "success": return <span className="pill-success">SUCCESS</span>;
      case "failed": return <span className="pill-danger">FAILED</span>;
      case "expired": return <span className="pill-warning">EXPIRED</span>;
      default: return <span className="pill-warning">PENDING</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle size={20} className="text-success" />;
      case "failed": return <XCircle size={20} className="text-danger" />;
      default: return <Clock size={20} className="text-warning" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="page-container">
      <div className="container-fluid px-md-4 py-4">
        <div className="mb-5 d-flex align-items-center gap-4">
          <div className="icon-badge-blue"><History size={32} /></div>
          <div><h1 className="fw-900 text-gradient mb-1">Payment History</h1><p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Audit Trail of Digital Transactions</p></div>
        </div>

        <div className="luxury-card p-0 overflow-hidden">
          <div className="p-4 border-bottom border-glass d-flex justify-content-between align-items-center gap-3">
             <h5 className="fw-900 text-gradient mb-0">Order Logs</h5>
             <div className="search-box-light bg-light" style={{maxWidth: '300px'}}>
                <Search size={18} className="text-primary" />
                <input type="text" placeholder="Search Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
          </div>
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4 py-4 text-muted extra-small fw-800 text-uppercase">Order ID</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase">Date & Time</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase">Amount</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase">Gateway ID</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-5"><Loader2 size={48} className="animate-spin text-primary mx-auto" /></td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-5"><FileText size={48} className="mx-auto opacity-30 mb-3" /><p className="fw-800 uppercase text-muted">No transactions found</p></td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="ps-4 py-3 fw-900 font-monospace text-primary">{order.orderId}</td>
                      <td className="text-muted extra-small fw-800 uppercase">
                        <div>{new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
                        <div className="opacity-60">{new Date(order.createdAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="fw-900 text-secondary">₹{order.amount.toLocaleString()}</td>
                      <td className="font-monospace extra-small fw-900 text-muted">{order.paymentId || "—"}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                           {getStatusIcon(order.status)}
                           {getStatusPill(order.status)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentHistory;
