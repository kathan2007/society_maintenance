import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Maintenance from "./pages/Maintenance";
import Complaint from "./pages/Complaint";
import Notice from "./pages/Notice";
import Visitor from "./pages/Visitor";
import AdminComplaints from "./pages/AdminComplaints";
import AdminUsers from "./pages/AdminUsers";
import AdminVisitors from "./pages/AdminVisitors";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import PaymentHistory from "./pages/PaymentHistory";
import Checkout from "./pages/payment/Checkout";
import Success from "./pages/payment/Success";
import Failure from "./pages/payment/Failure";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

/* ---------- LAYOUT WRAPPER ---------- */
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="app-layout min-vh-100" style={{ background: "#f8fafc", display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <main className="content-area" style={{ flex: '1 0 auto' }}>
      <div className="container-fluid px-0">
        {children}
      </div>
    </main>
    <Footer />
  </div>
);

/* ---------- ROUTE ARRAYS ---------- */
const userPaths = [
  { path: "/dashboard", Component: Dashboard },
  { path: "/notice", Component: Notice },
  { path: "/visitor", Component: Visitor },
  { path: "/maintenance", Component: Maintenance },
  { path: "/complaint", Component: Complaint },
  { path: "/expenses", Component: Expenses },
  { path: "/reports", Component: Reports },
  { path: "/payment-history", Component: PaymentHistory },
  { path: "/checkout", Component: Checkout },
  { path: "/payment-success", Component: Success },
  { path: "/payment-failure", Component: Failure },
];

const adminPaths = [
  { path: "/admin-dashboard", Component: AdminDashboard },
  { path: "/admin-complaints", Component: AdminComplaints },
  { path: "/admin-users", Component: AdminUsers },
  { path: "/admin-visitors", Component: AdminVisitors },
  { path: "/expenses", Component: Expenses }, // Admins also use this for Ledger
  { path: "/reports", Component: Reports },
];

/* ---------- ANIMATED ROUTES ---------- */
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Resident/User Protected Routes */}
        {userPaths.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute adminOnly={false}>
                <Layout>
                  <Component />
                </Layout>
              </ProtectedRoute>
            }
          />
        ))}

        {/* Admin Protected Routes */}
        {adminPaths.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Component />
                </Layout>
              </ProtectedRoute>
            }
          />
        ))}

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

/* ---------- MAIN APP COMPONENT ---------- */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="main-wrapper">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
};

export default App;