import API_BASE_URL from "../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Users, Home, Phone, Mail, Calendar, ShieldCheck, Search, Filter, Loader2 } from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  email: string;
  username: string;
  flatNo: string;
  phoneNumber: string;
  vehicleCount: number;
  vehicleNumbers: string;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (u.flatNo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.vehicleNumbers?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

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
              <Users size={32} />
            </div>
            <div>
              <h1 className="fw-900 text-gradient mb-1">Resident Registry</h1>
              <p className="text-secondary small fw-800 text-uppercase letter-spacing-1">Comprehensive Directory of Society Members</p>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
             <div className="search-box-light d-none d-lg-flex">
                <Search size={18} className="text-primary" />
                <input 
                  type="text" 
                  placeholder="Search by name, flat, vehicle..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ color: '#000000', fontWeight: '800' }}
                />
             </div>
             <div className="stats-badge-blue">
                <ShieldCheck size={20} />
                <span>{filteredUsers.length} Active Profiles</span>
             </div>
          </div>
        </div>

        {/* --- MAIN CONTENT CARD --- */}
        <div className="luxury-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Resident Profile</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Apartment Unit</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Contact Information</th>
                  <th className="py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Vehicle Information</th>
                  <th className="text-end pe-4 py-4 text-muted extra-small fw-800 text-uppercase letter-spacing-1">Registration</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <Loader2 size={48} className="animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="py-5 opacity-40">
                        <Users size={64} className="text-primary mb-4 mx-auto" />
                        <h5 className="fw-900">No Match Found</h5>
                        <p className="extra-small text-uppercase letter-spacing-1">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, index) => (
                    <motion.tr 
                      key={u._id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="user-avatar-blue">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-900 text-secondary mb-0">{u.name}</div>
                            <div className="extra-small text-primary fw-800 text-uppercase letter-spacing-1" style={{fontSize: '0.65rem'}}>Verified Resident</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="unit-pill">
                          <Home size={14} className="text-primary" />
                          <span>Unit {u.flatNo}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="contact-item font-monospace">
                            <Phone size={12} className="text-primary" /> {u.phoneNumber}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="contact-item font-monospace">
                             <ShieldCheck size={12} className="text-primary" /> {u.vehicleCount} Vehicles
                          </div>
                          <div className="extra-small text-muted font-monospace ps-3">
                             {u.vehicleNumbers || "No vehicles listed"}
                          </div>
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <div className="registration-date font-monospace">
                          <Calendar size={14} className="text-primary" />
                          <span>{new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
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

export default AdminUsers;