import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
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
      name: (fd.get("name") as string)?.trim(),
      username: (fd.get("username") as string)?.trim().toLowerCase(),
      password: fd.get("password") as string,
      phoneNumber: (fd.get("phoneNumber") as string)?.trim(),
      role,
    };

    if (role === "user") {
      data.flatNo = (fd.get("flatNo") as string)?.trim() || "A-101";
      data.category = fd.get("category") || "owner";
      data.vehicleCount = parseInt(fd.get("vehicleCount") as string) || 0;
      data.vehicleNumbers = (fd.get("vehicleNumbers") as string)?.trim() || "";
    }

    if (data.password.length < 10) {
      setError("Password must be at least 10 characters long.");
      setLoading(false);
      return;
    }

    if (role === "user" && !/^[6-9]\d{9}$/.test(data.phoneNumber)) {
      setError("Please enter a valid 10-digit Indian phone number.");
      setLoading(false);
      return;
    }

    try {
      await authApi.register(data as any);
      toast.success("Account created successfully! Please sign in.");
      setTimeout(() => navigate("/"), 800);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please verify fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 540 }}>
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
              <UserPlus size={24} />
            </div>
            <h1>Register Member</h1>
            <p>Shree Hari Gift City Residential Association</p>
          </div>

          {/* Role switcher */}
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
                onClick={() => setRole(r as "user" | "admin")}
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
                }}
              >
                {r === "user" ? "Resident Registration" : "Admin Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister}>
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

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label-v3">Full Name</label>
                <input name="name" type="text" className="form-control-v3" placeholder="e.g. Kathan Darji" required />
              </div>

              <div className="col-md-6">
                <label className="form-label-v3">Desired Username</label>
                <input name="username" type="text" className="form-control-v3" placeholder="e.g. kathandarji" required />
              </div>

              {/* Resident-Specific Details */}
              {role === "user" && (
                <>
                  <div className="col-md-6">
                    <label className="form-label-v3">Flat / Unit Number</label>
                    <input name="flatNo" type="text" className="form-control-v3" placeholder="e.g. A-101" required />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label-v3">Occupancy Category</label>
                    <select name="category" className="form-select-v3">
                      <option value="owner">Owner Resident</option>
                      <option value="rent">Tenant / Leased</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label-v3">Vehicle Count</label>
                    <input name="vehicleCount" type="number" min={0} max={10} defaultValue={0} className="form-control-v3" />
                  </div>

                  <div className="col-md-8">
                    <label className="form-label-v3">Vehicle Reg Number(s)</label>
                    <input name="vehicleNumbers" type="text" className="form-control-v3" placeholder="e.g. GJ01XX1234" />
                  </div>
                </>
              )}

              <div className="col-md-6">
                <label className="form-label-v3">Phone Number (10 digits)</label>
                <input name="phoneNumber" type="tel" className="form-control-v3" placeholder="9876543210" required />
              </div>

              <div className="col-md-6">
                <label className="form-label-v3">Password (min 10 chars)</label>
                <div className="position-relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="form-control-v3 pe-5"
                    placeholder="••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-gold w-100 mt-4" disabled={loading} style={{ minHeight: "44px" }}>
              {loading ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Registration...</span>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <span>Complete Registration</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </button>

            <p className="text-center mt-4 mb-0" style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              Already registered?{" "}
              <Link to="/" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Sign In
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
