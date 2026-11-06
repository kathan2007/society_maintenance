import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, LifeBuoy, ChevronRight, Inbox, User, Home, Users } from "lucide-react";

const Complaint: React.FC = () => {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{type:string,text:string}>({type:"",text:""});

  const token = localStorage.getItem("token");

  const fetchComplaints = async () => {
    if(!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/complaint`,{
        headers:{Authorization:`Bearer ${token}`}
      });
      setComplaints(res.data);
    } catch(err){
      setAlert({ type:"danger", text:"Failed to sync your complaints." });
    }
  };

  useEffect(()=>{
    fetchComplaints();
  },[]);

  const sendComplaint = async () => {
    if(!message.trim()){
      setAlert({ type:"warning", text:"Please describe the issue in detail." });
      return;
    }

    try{
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/complaint`,
        { message, category },
        { headers:{Authorization:`Bearer ${token}`} }
      );
      setMessage("");
      setAlert({ type:"success", text:"Ticket raised successfully! We'll update you soon." });
      fetchComplaints();
    }catch(err){
      setAlert({ type:"danger", text:"Transmission error. Please try again." });
    }finally{
      setLoading(false);
      setTimeout(() => setAlert({type:"", text:""}), 5000);
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
        <div className="mb-5 d-flex align-items-center gap-4">
          <div className="icon-badge-blue">
            <LifeBuoy size={32} />
          </div>
          <div>
            <h1 className="fw-900 text-gradient mb-1">Help & Support</h1>
            <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Raise & Track Your Society Tickets</p>
          </div>
        </div>

        {/* --- ALERTS --- */}
        <AnimatePresence>
          {alert.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`custom-alert alert-minimal-${alert.type === 'danger' ? 'danger' : 'blue'} mb-4`}
            >
              <AlertCircle size={20} />
              <span className="fw-bold">{alert.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="row g-5">
          {/* LEFT: FORM SIDE */}
          <div className="col-lg-5 col-xl-4">
            <div className="luxury-card p-4 h-100">
              <h5 className="fw-900 text-gradient mb-4 d-flex align-items-center gap-2">
                <MessageSquare size={22} className="text-primary" />
                New Support Ticket
              </h5>

              <div className="mb-4">
                <label className="extra-small fw-800 text-muted text-uppercase mb-2 d-block letter-spacing-1">Issue Category</label>
                <select
                  className="modern-select"
                  value={category}
                  onChange={(e)=>setCategory(e.target.value)}
                >
                  <option value="General">General Inquiry</option>
                  <option value="Plumbing">Plumbing & Water</option>
                  <option value="Electrical">Electrical & Power</option>
                  <option value="Security">Security & Access</option>
                  <option value="Cleaning">Housekeeping</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="extra-small fw-800 text-muted text-uppercase mb-2 d-block letter-spacing-1">Detailed Description</label>
                <textarea
                  className="modern-textarea"
                  rows={6}
                  placeholder="Tell us what's wrong..."
                  value={message}
                  onChange={(e)=>setMessage(e.target.value)}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={sendComplaint}
                className="btn-blue-solid w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? <span className="animate-spin"><Inbox size={20}/></span> : <><Send size={18}/> Transmit Ticket</>}
              </motion.button>
            </div>
          </div>

          {/* RIGHT: HISTORY SIDE */}
          <div className="col-lg-7 col-xl-8">
            <div className="luxury-card h-100 p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-glass">
                <h5 className="fw-900 text-gradient mb-0 d-flex align-items-center gap-3">
                  <Users size={24} className="text-primary" />
                  Society Community Feed
                </h5>
                <span className="pill-blue">{complaints.length} Total Issues</span>
              </div>

              <div className="custom-scrollbar pe-2" style={{maxHeight: '600px', overflowY: 'auto'}}>
                {complaints.length === 0 ? (
                  <div className="text-center py-5 opacity-50">
                    <MessageSquare size={64} className="mb-4 text-primary" />
                    <h5 className="fw-900">Digital Silence</h5>
                    <p className="extra-small text-uppercase letter-spacing-1">No active support tickets found</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {complaints.map((c:any, index:number)=>(
                      <motion.div
                        key={c._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="ticket-card-blue"
                      >
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <span className="pill-category">{c.category}</span>
                            <div className="d-flex align-items-center gap-2 text-primary extra-small fw-900 uppercase">
                               <User size={12} /> {c.userId?.name || "Member"}
                            </div>
                            <div className="d-flex align-items-center gap-2 text-muted extra-small fw-900 uppercase">
                               <Home size={12} /> {c.userId?.flatNo || "N/A"}
                            </div>
                          </div>
                          <StatusBadge status={c.status}/>
                        </div>
                        
                        <p className="mb-2 text-secondary small fw-medium">
                          {c.message}
                        </p>

                        <div className="d-flex align-items-center gap-2 text-muted mt-2" style={{fontSize: '0.65rem'}}>
                           <Clock size={10} />
                           <span className="fw-800 uppercase letter-spacing-1">Reported: {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({status}:{status:string}) => {
  const configs:any = {
    Pending: { className: "status-pill-amber", icon: <Clock size={14}/> },
    "In Progress": { className: "status-pill-blue", icon: <AlertCircle size={14}/> },
    Resolved: { className: "status-pill-green", icon: <CheckCircle size={14}/> }
  };
  const config = configs[status] || configs.Pending;

  return (
    <div className={`status-badge-modern ${config.className}`}>
      {config.icon}
      <span className="text-uppercase letter-spacing-1 extra-small">{status}</span>
    </div>
  );
};

export default Complaint;