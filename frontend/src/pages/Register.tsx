import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../api/services";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: Record<string, any> = {
      name: fd.get("name") as string,
      username: fd.get("username") as string,
      password: fd.get("password") as string,
      phoneNumber: fd.get("phoneNumber") as string,
      role,
    };

    if (role === "user") {
      data.flatNo = fd.get("flatNo");
      data.category = fd.get("category");
      data.vehicleCount = parseInt(fd.get("vehicleCount") as string) || 0;
      data.vehicleNumbers = fd.get("vehicleNumbers");
    }

    if (data.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (role === "user" && !/^[0-9]{10}$/.test(data.phoneNumber)) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    try {
      await authApi.register(data as any);
      toast.success("Registration successful! Please log in.");
      setTimeout(() => navigate("/"), 800);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 560 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="auth-card"
        >
          {/* Branding */}
          <div className="auth-logo">
            <UserPlus size={48} color="var(--color-accent)" strokeWidth={1.5} />
            <h1>Join Society</h1>
            <p>Create your resident account</p>
          </div>

          {/* Role switcher */}
          <div className="d-flex p-1 mb-4" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", border: "var(--glass-border)", gap: 4 }}>
            {["user", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r as "user" | "admin")}
                style={{
                  flex: 1, padding: "8px 0", border: "none", borderRadius: "var(--radius-sm)",
                  background: role === r ? "var(--color-accent)" : "transparent",
                  color: role === r ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                  fontWeight: role === r ? 600 : 400,
                  cursor: "pointer", transition: "all var(--transition-fast)",
                }}
              >
                {r === "user" ? "Resident" : "Admin"}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister}>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="alert alert-danger mb-4" style={{ fontSize: "var(--text-sm)" }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Full Name</label>
                <input name="name" type="text" className="form-control" placeholder="Your full name" required />
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Username</label>
                <input name="username" type="text" className="form-control" placeholder="e.g. john_a101" required />
              </div>

              {/* Resident-only fields */}
              <AnimatePresence>
                {role === "user" && (
                  <motion.div
                    className="col-12"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Flat / Unit No.</label>
                        <input name="flatNo" type="text" className="form-control" placeholder="A-101" required={role === "user"} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Category</label>
                        <select name="category" className="form-select">
                          <option value="owner">Owner</option>
                          <option value="rent">Rent / Tenant</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Vehicles</label>
                        <input name="vehicleCount" type="number" min={0} defaultValue={0} className="form-control" />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Vehicle Numbers</label>
                        <input name="vehicleNumbers" type="text" className="form-control" placeholder="GJ01XX1234, ..." />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="col-md-6">
                <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Password</label>
                <div className="position-relative">
                  <input name="password" type={showPassword ? "text" : "password"} className="form-control" placeholder="Min 6 characters" required />
                  <button type="button" className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2" style={{ color: "var(--color-text-muted)" }} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Phone Number</label>
                <input name="phoneNumber" type="text" className="form-control" placeholder="10 digits" required={role === "user"} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 mt-4" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Complete Registration"}
            </button>

            <p className="text-center mt-4" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Already have an account?{" "}
              <Link to="/" style={{ color: "var(--color-accent)" }}>Sign In</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
