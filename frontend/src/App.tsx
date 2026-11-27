import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ── Lazy-loaded pages (code splitting) ──────────────────────
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Complaint = lazy(() => import("./pages/Complaint"));
const Notice = lazy(() => import("./pages/Notice"));
const Visitor = lazy(() => import("./pages/Visitor"));
const AdminComplaints = lazy(() => import("./pages/AdminComplaints"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminVisitors = lazy(() => import("./pages/AdminVisitors"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Reports = lazy(() => import("./pages/Reports"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const Checkout = lazy(() => import("./pages/payment/Checkout"));
const Success = lazy(() => import("./pages/payment/Success"));
const Failure = lazy(() => import("./pages/payment/Failure"));

/* ── Spinner shown while lazy chunks load ── */
const PageLoader: React.FC = () => (
  <div className="d-flex align-items-center justify-content-center min-vh-100">
    <div className="spinner-border" style={{ color: "var(--color-accent)" }} role="status">
      <span className="visually-hidden">Loading…</span>
    </div>
  </div>
);

/* ── Layout with Navbar + Footer ── */
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <main id="main" className="main-content">
      <div className="container-limit">{children}</div>
    </main>
    <Footer />
  </div>
);

/* ── Route config ── */
const userRoutes = [
  { path: "/dashboard", El: Dashboard },
  { path: "/maintenance", El: Maintenance },
  { path: "/complaint", El: Complaint },
  { path: "/notice", El: Notice },
  { path: "/visitor", El: Visitor },
  { path: "/expenses", El: Expenses },
  { path: "/reports", El: Reports },
  { path: "/payment-history", El: PaymentHistory },
  { path: "/checkout", El: Checkout },
  { path: "/payment-success", El: Success },
  { path: "/payment-failure", El: Failure },
];

const adminRoutes = [
  { path: "/admin-dashboard", El: AdminDashboard },
  { path: "/admin-complaints", El: AdminComplaints },
  { path: "/admin-users", El: AdminUsers },
  { path: "/admin-visitors", El: AdminVisitors },
  { path: "/expenses", El: Expenses },
  { path: "/reports", El: Reports },
];

/* ── Animated route switch ── */
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Resident routes */}
        {userRoutes.map(({ path, El }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute adminOnly={false}>
                <Layout><El /></Layout>
              </ProtectedRoute>
            }
          />
        ))}

        {/* Admin routes */}
        {adminRoutes.map(({ path, El }) => (
          <Route
            key={`admin-${path}`}
            path={path}
            element={
              <ProtectedRoute adminOnly>
                <Layout><El /></Layout>
              </ProtectedRoute>
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

/* ── Root App ── */
const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
