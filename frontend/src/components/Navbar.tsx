import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Bell,
  Users,
  ShieldCheck,
  LogOut,
  Building2,
  DollarSign,
  Menu,
  X,
  PieChart,
  History,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout: authLogout } = useAuth();

  const role = user?.role || localStorage.getItem("role") || "user";
  const name = user?.name || localStorage.getItem("name") || "Resident";

  const handleLogout = () => {
    authLogout();
    navigate("/", { replace: true });
  };

  const navItems =
    role === "admin"
      ? [
          { path: "/admin-dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
          { path: "/maintenance", label: "Maintenance Records", icon: <CreditCard size={20} /> },
          { path: "/expenses", label: "Ledger & Expenses", icon: <DollarSign size={20} /> },
          { path: "/admin-visitors", label: "Security & Gate", icon: <ShieldCheck size={20} /> },
          { path: "/admin-users", label: "Residents", icon: <Users size={20} /> },
          { path: "/admin-complaints", label: "Complaints", icon: <MessageSquare size={20} /> },
          { path: "/reports", label: "Reports", icon: <PieChart size={20} /> },
          { path: "/payment-history", label: "Transactions", icon: <History size={20} /> },
        ]
      : [
          { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
          { path: "/maintenance", label: "Maintenance & Pay", icon: <CreditCard size={20} /> },
          { path: "/complaint", label: "Complaints", icon: <MessageSquare size={20} /> },
          { path: "/notice", label: "Bulletins & Notices", icon: <Bell size={20} /> },
          { path: "/visitor", label: "Visitor Pre-approval", icon: <Users size={20} /> },
          { path: "/expenses", label: "Society Ledger", icon: <DollarSign size={20} /> },
          { path: "/reports", label: "Reports", icon: <PieChart size={20} /> },
          { path: "/payment-history", label: "Transactions", icon: <History size={20} /> },
        ];

  const bottomNavItems =
    role === "admin"
      ? [
          { path: "/admin-dashboard", label: "Home", icon: <LayoutDashboard size={20} /> },
          { path: "/maintenance", label: "Maintenance", icon: <CreditCard size={20} /> },
          { path: "/expenses", label: "Ledger", icon: <DollarSign size={20} /> },
          { path: "/admin-users", label: "Members", icon: <Users size={20} /> },
        ]
      : [
          { path: "/dashboard", label: "Home", icon: <LayoutDashboard size={20} /> },
          { path: "/maintenance", label: "Bills", icon: <CreditCard size={20} /> },
          { path: "/complaint", label: "Tickets", icon: <MessageSquare size={20} /> },
          { path: "/notice", label: "Bulletins", icon: <Bell size={20} /> },
        ];

  return (
    <>
      {/* ── Fixed Top Header (Strictly 64px height, high contrast Navy) ── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "var(--header-height)",
          backgroundColor: "var(--bg-sidebar)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          className="container-limit w-100 d-flex align-items-center justify-content-between"
          style={{ width: "100%" }}
        >
          {/* Brand & Menu Trigger */}
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Navigation Menu"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-on-dark)",
                cursor: "pointer",
                padding: "8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              to={role === "admin" ? "/admin-dashboard" : "/dashboard"}
              className="d-flex align-items-center gap-2 text-decoration-none"
              style={{ color: "var(--text-on-dark)" }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent)",
                  color: "var(--on-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "var(--text-base)",
                    letterSpacing: "0.02em",
                    color: "var(--text-on-dark)",
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  Shree Hari Gift City
                </span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--accent)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {role === "admin" ? "Administrative Portal" : "Resident Portal"}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Utilities: Theme Toggle + User Info + Logout */}
          <div className="d-flex align-items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "var(--text-on-dark)",
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* User Session Info (Desktop) */}
            <div className="d-none d-md-flex flex-column text-end">
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "rgba(255, 255, 255, 0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Signed In
              </span>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-on-dark)",
                  fontWeight: 600,
                }}
              >
                {name}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              aria-label="Sign out of account"
              title="Sign Out"
              style={{
                backgroundColor: "rgba(224, 60, 60, 0.15)",
                border: "1px solid rgba(255, 100, 100, 0.25)",
                color: "#ff8a98",
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                minHeight: "40px",
              }}
            >
              <LogOut size={16} />
              <span className="d-none d-sm-inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Sliding Navigation Drawer (Mobile & Desktop) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(11, 27, 58, 0.65)",
                backdropFilter: "blur(4px)",
                zIndex: 1100,
              }}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "300px",
                maxWidth: "85vw",
                backgroundColor: "var(--bg-sidebar)",
                borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 1200,
                display: "flex",
                flexDirection: "column",
                padding: "var(--space-6) var(--space-5)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {/* Drawer Top */}
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-white border-opacity-10">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--accent)",
                      color: "var(--on-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building2 size={18} />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-lg)",
                      fontWeight: 700,
                      color: "var(--text-on-dark)",
                    }}
                  >
                    Gift City
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-on-dark)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-grow-1 overflow-y-auto d-flex flex-column gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "var(--space-3) var(--space-4)",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: isActive ? "rgba(201, 162, 75, 0.15)" : "transparent",
                        color: isActive ? "var(--accent)" : "var(--text-on-dark)",
                        fontWeight: isActive ? 600 : 400,
                        fontSize: "var(--text-sm)",
                        textDecoration: "none",
                        transition: "all var(--transition-fast)",
                        borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={16} opacity={isActive ? 1 : 0.4} />
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer User Profile */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: "var(--space-4)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "rgba(255, 255, 255, 0.6)",
                        textTransform: "uppercase",
                      }}
                    >
                      {role === "admin" ? "Admin" : "Resident"}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--text-on-dark)",
                      }}
                    >
                      {name}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ff8a98",
                      cursor: "pointer",
                      padding: "8px",
                    }}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Navigation Bar (≤ 768px) ── */}
      <nav
        className="d-md-none"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60px",
          backgroundColor: "var(--bg-sidebar)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 1000,
        }}
        aria-label="Mobile Navigation"
      >
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? "var(--accent)" : "rgba(255, 255, 255, 0.65)",
                textDecoration: "none",
                fontSize: "11px",
                fontWeight: isActive ? 600 : 400,
                gap: "2px",
                minWidth: "60px",
                minHeight: "44px",
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255, 255, 255, 0.65)",
            background: "none",
            border: "none",
            fontSize: "11px",
            gap: "2px",
            minWidth: "60px",
            minHeight: "44px",
            cursor: "pointer",
          }}
          aria-label="Open More Menu"
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
