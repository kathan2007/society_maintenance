import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, Search, Calendar, LogIn, LogOut, UserPlus, Info, Loader2 } from "lucide-react";

interface VisitorType {
  _id: string;
  name: string;
  phone: string;
  expectedDate: string;
  purpose: string;
  status: string;
  userId?: {
    name: string;
    flatNo: string;
  };
}

const AdminVisitors: React.FC = () => {
  const [data, setData] = useState<VisitorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/visitor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.put(
        `${API_BASE_URL}/visitor/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  const filteredData = data.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.userId?.flatNo && v.userId.flatNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="page-container"
    >
      <div className="container-fluid px-md-4 py-4">
        
        {/* --- HEADER & CONTROLS --- */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div className="d-flex align-items-center gap-4">
            <div className="icon-badge-blue">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="fw-900 text-gradient mb-1">Gate Intelligence</h1>
              <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Live Monitoring of Entry & Exit Points</p>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
             <div className="search-box-light d-none d-md-flex">
                <Search size={18} className="text-primary" />
                <input type="text" placeholder="Filter entry logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <div className="stats-badge-blue py-2 px-4 shadow-sm">
                <div className="pulse-indicator-green"></div>
                <span className="extra-small fw-900 text-uppercase letter-spacing-1">SECURE_LIVE</span>
             </div>
          </div>
        </div>

        {/* --- VISITORS TABLE --- */}
        <div className="luxury-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Visitor Info</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Host Unit</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Log Timeline</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Current Status</th>
                  <th className="text-end pe-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Entry Control</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-5"><Loader2 size={48} className="animate-spin text-primary mx-auto" /></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="py-5 opacity-40">
                        <UserPlus size={64} className="text-primary mb-4 mx-auto" />
                        <h5 className="fw-900">Gate Secure</h5>
                        <p className="extra-small text-uppercase letter-spacing-1">No visitor movement detected at this time</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((v, i) => (
                    <motion.tr 
                      key={v._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td className="ps-4 py-3">
                        <div className="fw-900 text-secondary mb-0">{v.name}</div>
                        <div className="d-flex align-items-center gap-3 extra-small text-muted font-monospace">
                          <span className="fw-800">{v.phone}</span>
                          <span className="text-primary fw-900 text-uppercase">#{v.purpose}</span>
                        </div>
                      </td>
                      <td>
                        <div className="fw-900 text-secondary mb-0">Unit {v.userId?.flatNo || "N/A"}</div>
                        <div className="extra-small text-primary fw-800 text-uppercase letter-spacing-1" style={{fontSize: '0.65rem'}}>{v.userId?.name || "General"}</div>
                      </td>
                      <td>
                        <div className="timeline-box font-monospace">
                          <span className="date-main">{new Date(v.expectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span className="date-sub">{new Date(v.expectedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td>
                         <div className={`badge-status ${v.status.toLowerCase().replace(" ", "-")}`}>
                           <span className="dot" /> {v.status}
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <select
                          className="modern-select-sm"
                          value={v.status}
                          onChange={(e) => updateStatus(v._id, e.target.value)}
                        >
                          <option value="Expected">Expected</option>
                          <option value="Entered">Mark Entry</option>
                          <option value="Exited">Mark Exit</option>
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

export default AdminVisitors;