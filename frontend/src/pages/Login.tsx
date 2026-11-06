import API_BASE_URL from "../config/api";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
        role: role 
      });

      const userRole = res.data.role.toLowerCase();
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("category", res.data.category || 'owner');

      if (userRole === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err: any) {
      setError(err.response?.data?.message || "Login Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{background: '#2563eb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
      <div className="auth-container" style={{width: '100%', maxWidth: '450px'}}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 p-md-5 shadow-lg"
          style={{borderRadius: '16px', border: 'none'}}
        >
          {/* --- BRANDING --- */}
          <div className="text-center mb-5">
            <div className="bg-primary p-3 rounded-circle d-inline-block mb-3" style={{background: '#2563eb'}}>
              <Building2 size={40} className="text-white" />
            </div>
            <h2 className="fw-900 text-black mb-1 letter-spacing-1 text-uppercase">SHREE HARI GIFT CITY</h2>
            <p className="text-muted extra-small fw-900 text-uppercase letter-spacing-2">Secure Member Access</p>
          </div>

          <form onSubmit={handleLogin}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-danger bg-opacity-10 text-danger text-center mb-4 py-2 px-3 fw-800 rounded-3 extra-small text-uppercase border border-danger border-opacity-25"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- ROLE SWITCHER --- */}
            <div className="d-flex p-1 bg-light rounded-3 mb-4 border" style={{gap: '4px'}}>
              <button
                type="button"
                className={`w-100 py-2 rounded-2 fw-900 extra-small text-uppercase border-0 transition-all ${role === "user" ? "bg-white text-primary shadow-sm" : "bg-transparent text-muted"}`}
                style={{color: role === 'user' ? '#2563eb' : ''}}
                onClick={() => setRole("user")}
              >
                Resident
              </button>
              <button
                type="button"
                className={`w-100 py-2 rounded-2 fw-900 extra-small text-uppercase border-0 transition-all ${role === "admin" ? "bg-white text-primary shadow-sm" : "bg-transparent text-muted"}`}
                style={{color: role === 'admin' ? '#2563eb' : ''}}
                onClick={() => setRole("admin")}
              >
                Admin
              </button>
            </div>

            {/* --- INPUTS --- */}
            <div className="mb-4">
              <label className="extra-small fw-900 text-black text-uppercase mb-2 d-block letter-spacing-1">Username</label>
              <div className="position-relative">
                 <input
                    type="text"
                    className="form-control py-3 ps-4 fw-800 text-black border-2"
                    style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}}
                    placeholder="E.g. johndoe_123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
              </div>
            </div>

            <div className="mb-4">
              <label className="extra-small fw-900 text-black text-uppercase mb-2 d-block letter-spacing-1">Security Password</label>
              <input
                type="password"
                className="form-control py-3 ps-4 fw-800 text-black border-2"
                style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* --- ACTION BUTTON --- */}
            <button
              type="submit"
              className="btn w-100 py-3 mt-2 fw-900 text-uppercase letter-spacing-1 shadow-primary transition-all rounded-3"
              style={{background: '#2563eb', color: '#ffffff', border: 'none'}}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                "Sign In Securely"
              )}
            </button>

            <div className="text-center mt-5">
              <p className="extra-small text-muted fw-900 text-uppercase letter-spacing-1">
                Don't have an account? 
                <Link to="/register" className="ms-2 text-primary text-decoration-none fw-900" style={{color: '#2563eb'}}>
                  JOIN SOCIETY
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
        
        <p className="text-center text-white extra-small mt-4 fw-900 uppercase letter-spacing-2 opacity-75">
          &copy; 2026 SHREE HARI GIFT CITY PORTAL
        </p>
      </div>
    </div>
  );
};

export default Login;