import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import { 
  CheckCircle, Clock, Smartphone, 
  ShieldCheck, Loader2, ArrowLeft,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import API_BASE_URL from "../../config/api";

const socket = io(API_BASE_URL);

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [status, setStatus] = useState<"pending" | "processing" | "success" | "failed" | "expired">("pending");
  const [order, setOrder] = useState<any>(location.state?.order || null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!order) {
      navigate("/maintenance");
      return;
    }

    // 1. Join Socket Room
    socket.emit("join", order.orderId);

    // 2. Listen for Events
    socket.on("paymentSuccess", (data) => {
      console.log("Socket success:", data);
      setStatus("success");
      setTimeout(() => navigate("/payment-success", { state: { orderId: data.orderId, paymentId: data.paymentId } }), 1000);
    });

    socket.on("paymentFailed", () => {
      setStatus("failed");
      setTimeout(() => navigate("/payment-failure"), 1000);
    });

    // 3. Countdown Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 4. Polling Fallback
    const poll = setInterval(async () => {
       try {
         const res = await axios.get(`${API_BASE_URL}/api/payment/status/${order.orderId}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         if (res.data.status === "success") {
           setStatus("success");
           navigate("/payment-success", { state: { orderId: order.orderId } });
         }
       } catch (err) { console.error("Poll Error:", err); }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
      socket.off("paymentSuccess");
      socket.off("paymentFailed");
    };
  }, [order]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!order) return <Loader2 className="animate-spin" />;

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-5 shadow-lg overflow-hidden border"
        style={{ maxWidth: "450px", width: "100%" }}
      >
        {/* Header */}
        <div className="bg-primary p-4 text-white text-center">
            <h4 className="fw-900 mb-1 uppercase letter-spacing-1">Gateway Checkout</h4>
            <p className="opacity-75 small fw-800 m-0">Secure UPI Transaction • Society Maintenance</p>
        </div>

        {/* Content */}
        <div className="p-4 text-center">
           <div className="mb-4">
             <p className="text-muted extra-small fw-800 mb-1 uppercase">Payment Amount</p>
             <h1 className="fw-900 text-dark display-5">₹{order.amount.toLocaleString()}</h1>
           </div>

           {/* QR Display */}
           <div className={`p-4 rounded-4 border-2 border-dashed mb-4 position-relative ${status === 'expired' ? 'opacity-40 grayscale-filter' : ''}`}>
              <QRCodeCanvas 
                value={order.qrCodeUrl}
                size={220}
                className="mx-auto"
                level="H"
                includeMargin={true}
              />
              {status === 'expired' && (
                <div className="position-absolute top-50 start-50 translate-middle w-100 px-3">
                   <div className="bg-danger text-white p-2 rounded-3 shadow">
                      <AlertCircle size={24} className="mb-1" />
                      <p className="fw-900 small m-0 uppercase">QR EXPIRED</p>
                   </div>
                </div>
              )}
           </div>

           {/* Footer Info */}
           <div className="mb-4">
              <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                 <Clock size={16} className={timeLeft < 60 ? "text-danger animate-pulse" : "text-warning"} />
                 <span className={`fw-900 small font-monospace ${timeLeft < 60 ? 'text-danger' : 'text-dark'}`}>
                   Expires in: {formatTime(timeLeft)}
                 </span>
              </div>
              <p className="extra-small text-muted fw-800 uppercase letter-spacing-1">Scan with GPay, PhonePe, or BHIM</p>
           </div>

           <div className="p-3 bg-light rounded-4 d-flex align-items-center gap-3 justify-content-center mb-4 border">
              <ShieldCheck className="text-success" />
              <div className="text-start">
                 <p className="m-0 extra-small fw-900 text-secondary uppercase">Secure Transaction</p>
                 <p className="m-0 extra-small text-muted font-monospace">Order: {order.orderId}</p>
              </div>
           </div>

           {status === 'expired' ? (
              <button 
                className="btn btn-primary w-100 py-3 rounded-pill fw-900"
                onClick={() => navigate("/maintenance")}
              >
                RETRY PAYMENT
              </button>
           ) : (
             <div className="d-flex align-items-center justify-content-center gap-2 text-primary fw-900 small">
                <Loader2 size={16} className="animate-spin" />
                <span>Awaiting fulfillment...</span>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default Checkout;
