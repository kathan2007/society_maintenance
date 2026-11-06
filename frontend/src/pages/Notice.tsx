import API_BASE_URL from "../config/api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Plus, Calendar, Trash2, Megaphone, Info,
  AlertTriangle, PartyPopper, Wrench, Activity, Send, X, Loader2
} from "lucide-react";

interface NoticeType {
  _id: string;
  title: string;
  message: string;
  category: string;
  createdAt: string;
}

const Notice: React.FC = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [notices, setNotices] = useState<NoticeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [info, setInfo] = useState("");

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const fetchNotices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/notice`);
      const sortedData = res.data.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotices(sortedData);
    } catch (err) {
      console.error("Error fetching notices", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleAddNotice = async () => {
    if (!title || !message) return setInfo("Missing subject or message!");

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/notice`,
        { title, message, category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle(""); setMessage(""); setCategory("General");
      setInfo("Notice broadcasted successfully!");
      fetchNotices();
    } catch (err) {
      setInfo("Failed to broadcast.");
    } finally {
      setLoading(false);
      setTimeout(() => setInfo(""), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/notice/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotices(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      setInfo("Permission denied.");
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Emergency': return { icon: <AlertTriangle size={14} />, color: 'danger', label: 'Emergency' };
      case 'Event': return { icon: <PartyPopper size={14} />, color: 'success', label: 'Community Event' };
      case 'Maintenance': return { icon: <Wrench size={14} />, color: 'warning', label: 'Maintenance' };
      default: return { icon: <Info size={14} />, color: 'blue', label: 'General' };
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
        
        {/* --- HEADER --- */}
        <div className="mb-5 d-flex align-items-center gap-4">
          <div className="icon-badge-blue">
            <Megaphone size={32} />
          </div>
          <div>
            <h1 className="fw-900 text-gradient mb-1">Bulletin Board</h1>
            <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Real-time Community Announcements & Alerts</p>
          </div>
        </div>

        <div className="row g-5">
          {/* --- ADMIN: POST BULLETIN --- */}
          {role === "admin" && (
            <div className="col-lg-4">
              <div className="luxury-card p-4 sticky-top" style={{ top: "6rem" }}>
                <h5 className="fw-900 text-gradient mb-4 d-flex align-items-center gap-3">
                  <Plus size={24} className="text-primary" /> New Broadcast
                </h5>

                <div className="d-flex flex-column gap-4">
                  <div>
                    <label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Category</label>
                    <select className="modern-select w-100" value={category} onChange={(e)=>setCategory(e.target.value)} internal-select="">
                      <option value="General">General Notice</option>
                      <option value="Emergency">🚨 EMERGENCY</option>
                      <option value="Event">🎉 Community Event</option>
                      <option value="Maintenance">🛠️ Maintenance Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Subject</label>
                    <input className="modern-input w-100" placeholder="e.g. Water Supply Update" value={title} onChange={(e)=>setTitle(e.target.value)} />
                  </div>

                  <div>
                    <label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Details</label>
                    <textarea className="modern-textarea w-100" rows={5} placeholder="Write your announcement message here..." value={message} onChange={(e)=>setMessage(e.target.value)} />
                  </div>

                  <AnimatePresence>
                    {info && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="custom-alert alert-minimal-blue p-2 mb-0 text-center extra-small fw-800 text-uppercase">
                        {info}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-blue-solid w-100 py-3 d-flex align-items-center justify-content-center gap-3 fw-900 text-uppercase letter-spacing-1" 
                    onClick={handleAddNotice} 
                    disabled={loading}
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20}/> Push Live</>}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* --- FEED SECTION --- */}
          <div className={role === "admin" ? "col-lg-8" : "col-lg-10 mx-auto"}>
            <div className="luxury-card p-4 min-vh-75">
              <div className="d-flex justify-content-between align-items-center mb-5 pb-4 border-bottom border-glass">
                 <h5 className="fw-900 text-gradient mb-0 d-flex align-items-center gap-3">
                   <Activity size={24} className="text-primary" /> Live Updates
                 </h5>
                 <span className="pill-blue">Latest First</span>
              </div>

              {fetching ? (
                <div className="text-center py-5"><Loader2 size={48} className="animate-spin text-primary mx-auto" /></div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {notices.length === 0 ? (
                    <div className="text-center py-5 opacity-40">
                      <Bell size={64} className="text-primary mb-4 mx-auto" />
                      <h5 className="fw-900">Archive Clear</h5>
                      <p className="extra-small text-uppercase letter-spacing-1">No community broadcasts recorded yet</p>
                    </div>
                  ) : (
                    notices.map((n, index) => {
                      const theme = getCategoryTheme(n.category);
                      return (
                        <motion.div 
                          key={n._id} 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: index * 0.05 }}
                          className={`notice-item-card border-left-${theme.color}`}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-3">
                              <span className={`pill-${theme.color} d-flex align-items-center gap-2 extra-small fw-800 text-uppercase letter-spacing-1`}>
                                {theme.icon} {theme.label}
                              </span>
                              <span className="extra-small text-muted d-flex align-items-center gap-2 fw-800 font-monospace">
                                <Calendar size={14} className="text-primary" /> {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {role === "admin" && (
                              <motion.button 
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                className="btn-delete-minimal" 
                                onClick={() => handleDelete(n._id)}
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            )}
                          </div>
                          <h6 className="fw-900 text-secondary mb-3">{n.title}</h6>
                          <p className="text-muted small mb-0 fw-medium line-height-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{n.message}</p>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
          </div>
        </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Notice;