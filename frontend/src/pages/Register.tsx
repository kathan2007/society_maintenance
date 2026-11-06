import API_BASE_URL from "../config/api";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Lock, Home, Phone, ShieldCheck, 
  UserPlus, Eye, EyeOff, Building2, Loader2 
} from "lucide-react";

interface RegisterData {
  name: string;
  username: string;
  category: string;
  vehicleCount: number;
  vehicleNumbers: string;
  password: string;
  flatNo: string;
  phoneNumber: string;
  role?: string;
}

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

    const formData = new FormData(e.currentTarget);
    const data: RegisterData = {
      name: formData.get("name") as string,
      username: formData.get("username") as string,
      category: formData.get("category") as string,
      vehicleCount: parseInt(formData.get("vehicleCount") as string) || 0,
      vehicleNumbers: formData.get("vehicleNumbers") as string,
      password: formData.get("password") as string,
      flatNo: formData.get("flatNo") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      role
    };

    if (data.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(data.phoneNumber)) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/register`, data);
      if (res.status === 201 || res.data.success) {
        setTimeout(() => navigate("/"), 800);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{background: '#2563eb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
      <div className="auth-container" style={{ width: "100%", maxWidth: "600px" }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 p-md-5 shadow-lg"
          style={{borderRadius: '16px', border: 'none'}}
        >
          {/* Header Section */}
          <div className="text-center mb-5">
            <div className="bg-primary p-3 rounded-circle d-inline-block mb-3" style={{background: '#2563eb'}}>
              <UserPlus size={40} className="text-white" />
            </div>
            <h2 className="fw-900 text-black mb-1 letter-spacing-1 text-uppercase">Joint Registry</h2>
            <p className="text-muted extra-small fw-900 text-uppercase letter-spacing-2">Initialize Your Account</p>
          </div>

          <form onSubmit={handleRegister}>
            {/* Role Switcher */}
            <div className="d-flex p-1 bg-light rounded-3 mb-5 border" style={{gap: '4px'}}>
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

            {/* Error Message */}
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

            {/* Form Fields */}
            <div className="row g-4">
              <div className="col-12">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">Full Legal Name</label>
                <input name="name" type="text" className="form-control py-3 ps-4 fw-800 text-black border-2" style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}} placeholder="John Doe" required />
              </div>

              <div className="col-12">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">Unique Username</label>
                <input name="username" type="text" className="form-control py-3 ps-4 fw-800 text-black border-2" style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}} placeholder="john_doe_99" required />
              </div>

              <div className="col-md-4">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">Category</label>
                <select name="category" className="form-select py-3 ps-4 fw-800 text-black border-2" style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}} required>
                  <option value="owner">Owner</option>
                  <option value="rent">Rent / Tenant</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">Vehicles Count</label>
                <input name="vehicleCount" type="number" min="0" defaultValue="0" className="form-control py-3 ps-4 fw-800 text-black border-2" style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}} required />
              </div>

              <div className="col-md-4">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">Vehicle Numbers</label>
                <input name="vehicleNumbers" type="text" className="form-control py-3 ps-4 fw-800 text-black border-2" style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}} placeholder="GJ01XX1234, ..." />
              </div>

              <div className="col-md-6">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">Access Password</label>
                <div className="position-relative">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    className="form-control py-3 ps-4 fw-800 text-black border-2" 
                    style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}}
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">
                  {role === "admin" ? "Secret Admin Code" : "Flat / Unit Number"}
                </label>
                <input name="flatNo" type="text" className="form-control py-3 ps-4 fw-800 text-black border-2" style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}} placeholder="E.g. A-101" required />
              </div>

              <div className="col-md-6">
                <label className="extra-small text-black fw-900 text-uppercase mb-2 ms-1 letter-spacing-1">Phone Number</label>
                <input name="phoneNumber" type="text" className="form-control py-3 ps-4 fw-800 text-black border-2" style={{borderRadius: '12px', borderColor: '#e2e8f0', background: '#f8fafc', fontSize: '0.9rem'}} placeholder="10 Digits" required />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn w-100 py-3 mt-5 fw-900 text-uppercase letter-spacing-1 shadow-primary transition-all rounded-3"
              style={{background: '#2563eb', color: '#ffffff', border: 'none'}}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin mx-auto" />
              ) : (
                "Complete Registration"
              )}
            </button>

            <div className="text-center mt-5">
              <p className="extra-small text-muted fw-900 text-uppercase letter-spacing-1">
                Have an account? 
                <Link to="/" className="ms-2 text-primary text-decoration-none fw-900" style={{color: '#2563eb'}}>
                  LOGIN NOW
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

export default Register;