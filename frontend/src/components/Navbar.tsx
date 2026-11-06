import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, CreditCard, MessageSquare, 
  Bell, Users, ShieldCheck, LogOut, Building2, 
  DollarSign, Menu, X, UserCircle, ChevronRight,
  TrendingUp, PieChart, History
} from "lucide-react";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");

  const logout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const navItems = role === "admin" 
    ? [
        { path: "/admin-dashboard", label: "Dashboard", icon: <LayoutDashboard size={22} /> },
        { path: "/expenses", label: "Finance / Ledger", icon: <DollarSign size={22} /> },
        { path: "/admin-visitors", label: "Security", icon: <ShieldCheck size={22} /> },
        { path: "/admin-users", label: "Residents", icon: <Users size={22} /> },
        { path: "/admin-complaints", label: "Complaints", icon: <MessageSquare size={22} /> },
        { path: "/reports", label: "Reports", icon: <PieChart size={22} /> },
        { path: "/payment-history", label: "Transaction Logs", icon: <History size={22} /> },
      ]
    : [
        { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={22} /> },
        { path: "/expenses", label: "Society Ledger", icon: <TrendingUp size={22} /> },
        { path: "/maintenance", label: "Payments", icon: <CreditCard size={22} /> },
        { path: "/complaint", label: "Complaints", icon: <MessageSquare size={22} /> },
        { path: "/notice", label: "Notices", icon: <Bell size={22} /> },
        { path: "/visitor", label: "Visitors", icon: <Users size={22} /> },
        { path: "/reports", label: "Reports", icon: <PieChart size={22} /> },
        { path: "/payment-history", label: "Transaction Logs", icon: <History size={22} /> },
      ];

  const toggleNavbar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* --- Unified Top Header (Visible on ALL devices) --- */}
      <div className="unified-header">
        <div className="d-flex align-items-center justify-content-between h-100 px-4">
          <div className="d-flex align-items-center gap-3">
             <button 
                className="hamburger-trigger" 
                onClick={toggleNavbar}
                aria-label="Toggle Navigation"
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            <div className="d-flex align-items-center gap-2 border-start border-white border-opacity-25 ps-3 ms-1 d-none d-sm-flex">
              <Building2 size={24} className="text-white" />
              <span className="fw-900 text-white letter-spacing-2 small text-uppercase">Shree Hari Gift City Portal</span>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
             <div className="d-none d-md-block text-end me-2">
                <p className="m-0 text-white extra-small fw-900 opacity-75 text-uppercase letter-spacing-1">Active Session</p>
                <p className="m-0 text-white small fw-900 text-uppercase">{name || 'User'}</p>
             </div>
             <div className="bg-white rounded-circle p-1" style={{width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <UserCircle size={28} className="text-primary" style={{color: '#2563eb'}} />
             </div>
          </div>
        </div>
      </div>

      {/* --- Page Overlay --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsOpen(false)}
            className="modal-overlay"
            style={{ zIndex: 1150, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>

      {/* --- Sliding Sidebar (Same for Mobile & Laptop) --- */}
      <aside className={`main-sidebar-sliding ${isOpen ? "open" : ""}`}>
        <div className="h-100 d-flex flex-column py-5 px-4">
          
          {/* Internal Header */}
          <div className="mb-5 px-2 text-white">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white p-2 rounded-2">
                <Building2 size={24} style={{color: '#2563eb'}} />
              </div>
              <h4 className="fw-900 m-0 letter-spacing-1">SHREE HARI GIFT CITY</h4>
            </div>
            <p className="text-white text-opacity-75 extra-small fw-900 m-0 mt-2 uppercase letter-spacing-1">Management Overview</p>
          </div>

          {/* Navigation Items (White on Blue) */}
          <div className="flex-grow-1 custom-scrollbar overflow-y-auto">
            <p className="extra-small text-white text-opacity-50 fw-900 text-uppercase mb-4 px-2 letter-spacing-2">Main Controls</p>
            <div className="d-flex flex-column gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`sliding-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                        if (window.innerWidth < 1200) setIsOpen(false);
                    }}
                  >
                    <span className="icon-span">{item.icon}</span>
                    <span className="label-span">{item.label}</span>
                    {isActive && <ChevronRight size={16} className="ms-auto" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Logout Action */}
          <div className="mt-auto pt-4 border-top border-white border-opacity-10">
            <button 
              className="sliding-logout-btn w-100"
              onClick={logout}
            >
              <LogOut size={20} />
              <span>TERMINATE SESSION</span>
            </button>
          </div>

        </div>
      </aside>

      <style>{`
        .unified-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: #2563eb;
          z-index: 1300;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .hamburger-trigger {
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .hamburger-trigger:hover {
          transform: scale(1.1);
        }

        .main-sidebar-sliding {
          position: fixed;
          left: -320px;
          top: 70px;
          bottom: 0;
          width: 300px;
          background: #2563eb;
          z-index: 1200;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.1);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        .main-sidebar-sliding.open {
          transform: translateX(320px);
        }
        
        .sliding-nav-link {
          display: flex;
          align-items: center;
          padding: 1.1rem 1.25rem;
          border-radius: 12px;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.2s;
          opacity: 0.8;
          font-weight: 900;
        }
        .sliding-nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          opacity: 1;
          transform: translateX(5px);
        }
        .sliding-nav-link.active {
          background: #ffffff;
          color: #000000 !important;
          opacity: 1;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .sliding-nav-link .icon-span {
          margin-right: 1.25rem;
        }
        .sliding-nav-link .label-span {
          font-weight: 900;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .sliding-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.1rem;
          border: 2px solid rgba(255,255,255,0.3);
          background: transparent;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 1px;
          transition: all 0.2s;
        }
        .sliding-logout-btn:hover {
          background: #ffffff;
          color: #2563eb;
          border-color: #ffffff;
        }
      `}</style>
    </>
  );
};

export default Navbar;