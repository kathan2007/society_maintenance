import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Loader2 } from "lucide-react";
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
    if (!username || !password) { setError("Please fill in all fields."); return; }

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

      // Persist legacy keys for full compatibility across all resident & admin screens
      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("name", userName);
      localStorage.setItem("userId", userId);
      localStorage.setItem("category", category);

      login(token, authUser);
      toast.success(`Welcome, ${userName}!`);
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
      <div style={{ width: "100%", maxWidth: 480 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="auth-card"
        >
          {/* Branding */}
          <div className="auth-logo">
            <Building2 size={48} color="var(--color-accent)" strokeWidth={1.5} />
            <h1>Shree Hari Gift City</h1>
            <p>Secure Member Access</p>
          </div>

          {/* Role switcher */}
          <div className="d-flex p-1 mb-4" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", border: "var(--glass-border)", gap: 4 }}>
            {["user", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: "8px 0", border: "none", borderRadius: "var(--radius-sm)",
                  background: role === r ? "var(--color-accent)" : "transparent",
                  color: role === r ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                  fontWeight: role === r ? 600 : 400,
                  cursor: "pointer", transition: "all var(--transition-fast)",
                  textTransform: "capitalize",
                }}
              >
                {r === "user" ? "Resident" : "Admin"}
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
                  className="alert alert-danger mb-4"
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-3">
              <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
                {role === "admin" ? "Admin Username" : "Resident Username"}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={role === "admin" ? "admin" : "e.g. johndoe_a101"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {role === "admin" && import.meta.env.DEV && (
              <div className="alert alert-info mb-4" style={{ fontSize: "var(--text-xs)" }}>
                Default dev credentials: <code>admin</code> / <code>admin</code>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 py-3" disabled={loading}>
              {loading ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                "Sign In Securely"
              )}
            </button>

            <p className="text-center mt-4" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--color-accent)" }}>Join Society</Link>
            </p>
          </form>
        </motion.div>

        <p className="text-center mt-4" style={{ color: "rgba(255,255,255,0.3)", fontSize: "var(--text-xs)" }}>
          © 2026 Shree Hari Gift City Portal
        </p>
      </div>
    </div>
  );
};

export default Login;
