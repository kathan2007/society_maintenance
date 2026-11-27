import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../types";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login(username, password);
      const data = res.data as any;
      const token = data.token;
      const userObj = data.user || data;

      const userId = userObj._id || userObj.userId || userObj.id || data.userId || data.id || "unknown";
      const userRole = (userObj.role || data.role || role || "user").toLowerCase();
      const userName = userObj.name || data.name || username;
      const flatNo = userObj.flatNo || data.flatNo || "A-101";
      const category = userObj.category || data.category || "owner";

      const authUser: AuthUser = {
        id: userId,
        role: userRole as "user" | "admin",
        name: userName,
        flatNo: flatNo,
      };

      // Persist legacy storage keys
      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("name", userName);
      localStorage.setItem("userId", userId);
      localStorage.setItem("category", category);

      login(token, authUser);
      toast.success(`Welcome back, ${userName}!`);
      navigate(userRole === "admin" ? "/admin-dashboard" : "/dashboard", { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to connect to server. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 460 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="auth-card"
        >
          {/* Branding */}
          <div className="auth-logo">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--accent)",
                color: "var(--on-accent)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "var(--space-2)",
              }}
            >
              <Building2 size={26} />
            </div>
            <h1>Shree Hari Gift City</h1>
            <p>Residential Society Portal</p>
          </div>

          {/* Role switcher segmented control */}
          <div
            className="d-flex p-1 mb-4"
            style={{
              backgroundColor: "var(--bg-canvas)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              gap: 4,
            }}
          >
            {["user", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: role === r ? "var(--accent)" : "transparent",
                  color: role === r ? "var(--on-accent)" : "var(--text-secondary)",
                  fontWeight: role === r ? 600 : 500,
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  textTransform: "capitalize",
                }}
              >
                {r === "user" ? "Resident" : "Administrator"}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                  style={{
                    backgroundColor: "var(--danger-bg)",
                    color: "var(--danger)",
                    border: "1px solid rgba(163, 34, 51, 0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 14px",
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-3">
              <label className="form-label-v3">
                {role === "admin" ? "Admin Username" : "Resident Username"}
              </label>
              <input
                type="text"
                className="form-control-v3"
                placeholder={role === "admin" ? "admin" : "e.g. kathan"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label-v3">Security Password</label>
              <input
                type="password"
                className="form-control-v3"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {role === "admin" && import.meta.env.DEV && (
              <div
                className="mb-4"
                style={{
                  backgroundColor: "var(--bg-canvas)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-secondary)",
                }}
              >
                Development Credentials: <code>admin</code> / <code>admin</code>
              </div>
            )}

            <button type="submit" className="btn-gold w-100" disabled={loading} style={{ minHeight: "44px" }}>
              {loading ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <span>Sign In to Portal</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </button>

            <p className="text-center mt-4 mb-0" style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Join Society
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
