import React from "react";
import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const Failure: React.FC = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4 text-center">
       <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-5 rounded-5 shadow-lg border" style={{ maxWidth: '450px', width: '100%' }}>
         <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 p-4 shadow" style={{ width: '100px', height: '100px' }}>
            <XCircle size={64} />
         </div>
         <h2 className="fw-900 text-dark display-6 mb-2">Payment Failed</h2>
         <p className="text-secondary fw-800 extra-small uppercase letter-spacing-1 mb-5">Transaction Status: REJECTED ❌</p>

         <div className="text-start mb-5 d-flex flex-column gap-3 p-4 bg-light rounded-4 border">
            <p className="fw-800 text-muted extra-small uppercase m-0">Potential Causes:</p>
            <ul className="extra-small fw-800 text-secondary list-unstyled">
               <li className="mb-2 d-flex align-items-center gap-2"><div className="bg-danger p-1 rounded-circle" style={{width: '6px', height: '6px'}} /> Insufficient Bank Balance</li>
               <li className="mb-2 d-flex align-items-center gap-2"><div className="bg-danger p-1 rounded-circle" style={{width: '6px', height: '6px'}} /> UPI Daily Transaction Limit Reached</li>
               <li className="mb-2 d-flex align-items-center gap-2"><div className="bg-danger p-1 rounded-circle" style={{width: '6px', height: '6px'}} /> Network Connectivity Failure</li>
            </ul>
         </div>

         <div className="d-grid gap-3 mb-5">
            <Link to="/maintenance" className="btn btn-danger w-100 py-3 rounded-pill fw-900 shadow-danger d-flex align-items-center justify-content-center gap-2"><RotateCcw size={20} /> Retry Payment</Link>
            <Link to="/dashboard" className="btn btn-light w-100 py-3 rounded-pill fw-900 shadow-minimal d-flex align-items-center justify-content-center gap-2 text-muted uppercase"><ArrowLeft size={20} /> Dashboard</Link>
         </div>

         <div className="d-flex align-items-center justify-content-center gap-4 pt-4 border-top opacity-50">
            <div className="d-flex align-items-center gap-1 extra-small fw-900 uppercase">Secure Logic</div>
            <div className="d-flex align-items-center gap-1 extra-small fw-900 uppercase">GPG Encryption</div>
         </div>
       </motion.div>
    </div>
  );
};

export default Failure;
