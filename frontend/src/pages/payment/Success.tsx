import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";

const Success: React.FC = () => {
  const location = useLocation();
  const { orderId, paymentId } = location.state || { orderId: "N/A", paymentId: "N/A" };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-5 rounded-5 shadow-lg border" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 p-4 shadow" style={{ width: '100px', height: '100px' }}>
          <CheckCircle size={64} />
        </div>
        <h2 className="fw-900 text-dark display-6 mb-2">Payment Received</h2>
        <p className="text-secondary fw-800 extra-small uppercase letter-spacing-1 mb-5">Transaction Status: SUCCESSFUL ✅</p>
        
        <div className="text-start mb-5 d-flex flex-column gap-3 p-4 bg-light rounded-4 border">
           <div className="d-flex justify-content-between extra-small"><span className="fw-800 text-muted uppercase">Reference ID</span><span className="fw-900 text-secondary font-monospace">{orderId}</span></div>
           <div className="d-flex justify-content-between extra-small"><span className="fw-800 text-muted uppercase">Gateway Auth</span><span className="fw-900 text-primary font-monospace">{paymentId || "RPAY_AUTH_CAPTURED"}</span></div>
        </div>

        <div className="d-grid gap-3 mb-5">
           <Link to="/maintenance" className="btn btn-primary w-100 py-3 rounded-pill fw-900 shadow-blue d-flex align-items-center justify-content-center gap-2">Proceed to Dashboard <ArrowRight size={20} /></Link>
        </div>

        <div className="d-flex align-items-center justify-content-center gap-4 pt-4 border-top opacity-50">
           <div className="d-flex align-items-center gap-1 extra-small fw-900 uppercase"><div className="bg-primary p-1 rounded-circle" style={{width: '6px', height: '6px'}} /> 256-Bit SSL</div>
           <div className="d-flex align-items-center gap-1 extra-small fw-900 uppercase"><div className="bg-primary p-1 rounded-circle" style={{width: '6px', height: '6px'}} /> PCI-DSS Secure</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Success;
