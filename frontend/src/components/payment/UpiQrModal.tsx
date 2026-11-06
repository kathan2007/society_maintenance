import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Smartphone, ShieldCheck, Clock, 
  CheckCircle, AlertCircle, Loader2, ArrowRight,
  CreditCard, Search, Copy, Check
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";
import axios from "axios";
import API_BASE_URL from "../../config/api";

// Connect to backend socket
const socket = io(API_BASE_URL);

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess: () => void;
}

const UpiQrModal: React.FC<UpiQrModalProps> = ({ isOpen, onClose, order, onSuccess }) => {
  const [timeLeft, setTimeLeft] = useState(300);
  const [status, setStatus] = useState<"pending" | "processing" | "success" | "failed" | "expired">("pending");
  const [copied, setCopied] = useState(false);
  const token = localStorage.getItem("token");

  console.log("UpiQrModal Render State:", { isOpen, hasOrder: !!order });

  useEffect(() => {
    if (!isOpen || !order) return;

    setStatus("pending");
    setTimeLeft(300);

    // Join room for real-time updates
    socket.emit("join", order.orderId);

    const onPaymentSuccess = (data: any) => {
      if (data.orderId === order.orderId) {
        setStatus("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    };

    socket.on("paymentSuccess", onPaymentSuccess);

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling Fallback
    const poll = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/payment/status/${order.orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === "success" && status !== "success") {
           onPaymentSuccess({ orderId: order.orderId });
        }
      } catch (err) { console.error("Poll error", err); }
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
      socket.off("paymentSuccess", onPaymentSuccess);
    };
  }, [isOpen, order]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleCopy = () => {
    if (!order.upiId) return;
    navigator.clipboard.writeText(order.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && order && (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-4 rounded-4 shadow-lg text-center relative"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '90%' }}
          >
            {/* Breakdown Display */}
            <div className="mb-4 bg-light p-3 rounded-4 d-flex justify-content-between align-items-center">
               <div className="text-start">
                  <p className="m-0 extra-small fw-800 text-muted uppercase">Base Dues</p>
                  <p className="m-0 fw-900 text-dark">₹{order.baseAmount?.toLocaleString()}</p>
               </div>
               <div className="text-center">
                  <span className="text-muted fw-900">+</span>
               </div>
               <div className="text-end">
                  <p className="m-0 extra-small fw-800 text-muted uppercase">Penalty</p>
                  <p className={`m-0 fw-900 ${order.penalty > 0 ? 'text-danger' : 'text-dark'}`}>₹{order.penalty?.toLocaleString()}</p>
               </div>
            </div>

            <div className="mb-4">
               <h4 className="fw-900 text-dark mb-0">Scan to Pay ₹{order.amount.toLocaleString()}</h4>
               <p className="text-muted extra-small fw-900 uppercase tracking-widest">{order.month}</p>
            </div>

            {/* QR Display */}
            <div className={`p-3 border rounded-4 bg-white mb-3 relative ${status === 'expired' ? 'opacity-20 grayscale' : ''}`}>
              {status === 'success' ? (
                <div className="py-5 text-success flex flex-column items-center">
                  <CheckCircle size={80} className="mb-3" />
                  <h3 className="fw-900 uppercase">Payment Success</h3>
                </div>
              ) : (
                <div className="d-flex justify-content-center">
                  <QRCodeCanvas 
                    value={order.qrCodeUrl}
                    size={280}
                    level="H"
                    includeMargin={true}
                  />
                  {status === 'expired' && (
                    <div className="position-absolute top-50 start-50 translate-middle text-danger">
                      <AlertCircle size={48} />
                      <p className="fw-900 m-0">EXPIRED</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Copy UPI Action */}
            {status === 'pending' && order.upiId && (
               <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-center gap-2 p-2 bg-light rounded-pill border">
                     <span className="extra-small fw-900 text-secondary font-monospace">{order.upiId}</span>
                     <button 
                        onClick={handleCopy}
                        className="btn-copy-mini"
                     >
                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        <span className="ms-1">{copied ? 'Copied' : 'Copy ID'}</span>
                     </button>
                  </div>
               </div>
            )}

            {/* Simple Footer/Status */}
            {status === 'pending' && (
               <div className="d-flex flex-column align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2 text-warning px-3 py-2 bg-warning-light rounded-pill">
                     <Clock size={18} />
                     <span className="fw-900 font-monospace">Expires in: {formatTime(timeLeft)}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-primary mt-2">
                     <Loader2 size={16} className="animate-spin" />
                     <span className="extra-small fw-900 uppercase tracking-widest">Awaiting Confirmation...</span>
                  </div>
               </div>
            )}

            {status === 'expired' && (
              <button 
                className="btn btn-danger w-100 py-3 rounded-pill fw-900 mt-3"
                onClick={() => window.location.reload()}
              >
                RETRY PAYMENT
              </button>
            )}

            <button 
              onClick={onClose} 
              className="mt-4 text-muted small fw-900 border-0 bg-transparent uppercase tracking-widest hover:text-dark"
            >
              Cancel Transaction
            </button>
          </motion.div>
        </div>
      )}

      <style>{`
        .bg-warning-light { background: rgba(245, 158, 11, 0.1); }
        .btn-copy-mini {
          border: none;
          background: white;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        .btn-copy-mini:hover { background: #f1f5f9; transform: scale(1.05); }
      `}</style>
    </AnimatePresence>
  );
};

export default UpiQrModal;
