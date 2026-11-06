import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, CheckCircle, Clock, ShieldAlert, 
  User, Activity, MoreHorizontal, Filter, Search, Loader2 
} from "lucide-react";

interface ComplaintType {
  _id: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  userId?: { name: string; flatNo: string };
}

const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  const token = localStorage.getItem("token");

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/complaint`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.put(
        `${API_BASE_URL}/complaint/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInfo(`Status updated to ${newStatus}`);
      fetchComplaints();
      setTimeout(() => setInfo(""), 3000);
    } catch (err) {
      console.log(err);
      setInfo("Failed to update status");
      setTimeout(() => setInfo(""), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="page-container"
    >
      <div className="container-fluid px-md-4 py-4">
        
        {/* --- HEADER SECTION --- */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div className="d-flex align-items-center gap-4">
            <div className="icon-badge-blue">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h1 className="fw-900 text-gradient mb-1">Resolution Center</h1>
              <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Manage Resident Feedback & Critical System Issues</p>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
             <div className="search-box-light d-none d-md-flex">
                <Search size={18} className="text-primary" />
                <input type="text" placeholder="Filter reports..." />
             </div>
             <button className="icon-badge-blue" style={{width: '48px', height: '48px', borderRadius: '12px'}}><Filter size={20} /></button>
          </div>
        </div>

        {/* --- NOTIFICATION ALERT --- */}
        <AnimatePresence>
          {info && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`custom-alert mb-4 ${info.includes('Failed') ? 'alert-minimal-danger' : 'alert-minimal-blue'}`}
            >
              <div className="d-flex align-items-center gap-3">
                <CheckCircle size={20} />
                <span className="fw-800 extra-small text-uppercase letter-spacing-1">{info}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- COMPLAINTS TABLE CARD --- */}
        <div className="luxury-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Resident Identity</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Category</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Incident Details</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Status</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Timeline</th>
                  <th className="text-end pe-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Command</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <Loader2 size={48} className="animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="py-5 opacity-40">
                        <ShieldAlert size={64} className="text-primary mb-4 mx-auto" />
                        <h5 className="fw-900">Database Clear</h5>
                        <p className="extra-small text-uppercase letter-spacing-1">No community reports detected at this time</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  complaints.map((c, index) => (
                    <motion.tr 
                      key={c._id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar-circle-blue">
                            {c.userId?.name?.charAt(0) || <User size={16} />}
                          </div>
                          <div>
                            <div className="fw-900 text-secondary mb-0">{c.userId?.name || "Unknown Identity"}</div>
                            <div className="extra-small text-primary fw-800 text-uppercase letter-spacing-1" style={{fontSize: '0.65rem'}}>Unit {c.userId?.flatNo || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-pill-blue text-uppercase letter-spacing-1">{c.category}</span>
                      </td>
                      <td>
                        <p className="text-muted extra-small mb-0 fw-medium line-height-relaxed" style={{ maxWidth: '280px', whiteSpace: 'normal' }}>
                          {c.message}
                        </p>
                      </td>
                      <td>
                        <div className={`badge-status ${c.status.toLowerCase().replace(" ", "-")}`}>
                           <span className="dot" /> {c.status}
                        </div>
                      </td>
                      <td>
                        <div className="timeline-box font-monospace">
                          <span className="date-main">{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span className="date-sub">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <select 
                          className="modern-select-sm"
                          value={c.status}
                          onChange={(e) => updateStatus(c._id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </motion.tr>
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

export default AdminComplaints;