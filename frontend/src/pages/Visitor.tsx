import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Clock, CheckCircle, Plus, Shield, 
  Calendar, Phone, Info, AlertCircle, X, Loader2, UserCheck
} from "lucide-react";

interface VisitorType {
  _id: string;
  name: string;
  phone: string;
  expectedDate: string;
  purpose: string;
  status: string;
}

const Visitor: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorType[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{type:string, text:string}>({type:"", text:""});

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (alert.text) {
      const timer = setTimeout(() => setAlert({type:"", text:""}), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchVisitors = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/visitor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = res.data.sort((a: any, b: any) => 
        new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime()
      );
      setVisitors(sorted);
    } catch (err) {
      setAlert({ type: "danger", text: "Cloud sync failed." });
    }
  };

  useEffect(() => { fetchVisitors(); }, []);

  const addVisitor = async () => {
    if (!name || !phone || !date) {
      setAlert({ type: "warning", text: "Required fields missing." });
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/visitor`,
        { name, phone, expectedDate: date, purpose },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setName(""); setPhone(""); setDate(""); setPurpose("");
      setAlert({ type: "success", text: "Visitor pre-approved successfully!" });
      fetchVisitors();
    } catch (err) {
      setAlert({ type: "danger", text: "Security protocol failed." });
    } finally {
      setLoading(false);
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
        
        {/* HEADER */}
        <div className="mb-5 d-flex align-items-center gap-4">
          <div className="icon-badge-blue">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="fw-900 text-gradient mb-1">Security Registry</h1>
            <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Digital Gate Clearance & Access Monitoring</p>
          </div>
        </div>

        {/* FLOATING ALERTS */}
        <AnimatePresence>
          {alert.text && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`custom-alert alert-minimal-${alert.type === 'danger' ? 'danger' : 'blue'} mb-4`}>
              <div className="d-flex align-items-center gap-3">
                <Info size={20} className="text-primary" /> 
                <span className="fw-800 extra-small text-uppercase letter-spacing-1">{alert.text}</span>
              </div>
              <X size={20} className="cursor-pointer opacity-50" onClick={() => setAlert({type:"", text:""})} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="row g-5">
          {/* FORM: PRE-AUTHORIZE */}
          <div className="col-lg-4">
            <div className="luxury-card p-4 h-100">
              <h5 className="fw-900 text-gradient mb-4 d-flex align-items-center gap-3">
                <Plus size={24} className="text-primary" /> Pre-Authorize Guest
              </h5>

              <form onSubmit={(e) => { e.preventDefault(); addVisitor(); }}>
                <div className="mb-4">
                  <label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Full Identity</label>
                  <div className="input-with-icon">
                    <Users size={18} className="icon-left" />
                    <input className="modern-input" placeholder="Guest Name" value={name} onChange={(e)=>setName(e.target.value)} required />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Contact Line</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="icon-left" />
                    <input className="modern-input" placeholder="+91 XXXX XXXX" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Estimated Arrival</label>
                  <div className="input-with-icon">
                    <Calendar size={18} className="icon-left" />
                    <input type="datetime-local" className="modern-input" value={date} onChange={(e)=>setDate(e.target.value)} required />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="extra-small text-muted fw-800 text-uppercase mb-2 d-block letter-spacing-1">Purpose of Access</label>
                  <input className="modern-input" placeholder="e.g. Delivery, Guest, Social" value={purpose} onChange={(e)=>setPurpose(e.target.value)} />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-blue-solid w-100 py-3 d-flex align-items-center justify-content-center gap-3 fw-900 text-uppercase letter-spacing-1" 
                  disabled={loading}
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <><UserCheck size={20}/> Issue Security Pass</>}
                </motion.button>
              </form>
            </div>
          </div>

          {/* LIST: ACTIVE CLEARANCES */}
          <div className="col-lg-8">
            <div className="luxury-card p-0 overflow-hidden h-100">
              <div className="p-4 border-bottom border-glass d-flex justify-content-between align-items-center">
                <h5 className="fw-900 text-gradient mb-0 d-flex align-items-center gap-3">
                  <Clock size={24} className="text-primary" /> Active Access Passes
                </h5>
                <span className="pill-blue">{visitors.length} Managed</span>
              </div>

              <div className="p-0">
                <AnimatePresence mode="wait">
                  {visitors.length === 0 ? (
                    <div className="text-center py-5 opacity-40">
                      <Users size={64} className="mb-4 text-primary" />
                      <h5 className="fw-900">Sanctum Clear</h5>
                      <p className="extra-small text-uppercase letter-spacing-1">No upcoming guest arrivals recorded</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Guest Profile</th>
                            <th>Arrival Schedule</th>
                            <th>Status & Control</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitors.map((v, idx) => (
                            <motion.tr 
                              key={v._id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <td>
                                <div className="fw-900 text-secondary">{v.name}</div>
                                <div className="extra-small text-muted fw-800 font-monospace" style={{fontSize: '0.65rem'}}>{v.phone}</div>
                              </td>
                              <td>
                                <div className="small fw-900 text-primary mb-1">
                                  {new Date(v.expectedDate).toLocaleDateString([], {month: 'long', day: 'numeric'})}
                                </div>
                                <div className="extra-small text-muted fw-800 text-uppercase letter-spacing-1">
                                  {new Date(v.expectedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </td>
                              <td>
                                <StatusBadge status={v.status} />
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({status}:{status:string}) => {
  const map:any = {
    Expected: { color: "warning", label: "Scheduled", icon: <Clock size={14}/> },
    Entered:  { color: "success", label: "On-Premise", icon: <Shield size={14}/> },
    Exited:   { color: "secondary", label: "Checked Out", icon: <CheckCircle size={14}/> }
  };
  const current = map[status] || map["Expected"];

  return(
    <span className={`pill-${current.color} d-inline-flex align-items-center gap-2 extra-small fw-800 text-uppercase letter-spacing-1`}>
      {current.icon} {current.label}
    </span>
  );
};

export default Visitor;