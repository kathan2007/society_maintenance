import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";
import apiClient from "../../api/client";
import API_BASE_URL from "../../config/api";
import { formatCurrency } from "../../utils";

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
  const [selectedGateway, setSelectedGateway] = useState<"upi" | "razorpay" | "stripe">("upi");

  useEffect(() => {
    if (!isOpen || !order) return;

    setStatus("pending");
    setTimeLeft(300);

    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
    socket.emit("join", order.orderId);

    const onPaymentSuccess = (data: any) => {
      if (data.orderId === order.orderId) {
        setStatus("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      }
    };

    socket.on("payment:success", onPaymentSuccess);
    socket.on("paymentSuccess", onPaymentSuccess);

    // Countdown timer
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

    // Polling fallback
    const poll = setInterval(async () => {
      try {
        const res = await apiClient.get(`/api/payment/status/${order.orderId}`);
        if (res.data.status === "success" && status !== "success") {
          onPaymentSuccess({ orderId: order.orderId });
        }
      } catch (err) {}
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
      socket.disconnect();
    };
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleCopy = () => {
    if (!order.upiId) return;
    navigator.clipboard.writeText(order.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div
        className="modal-backdrop-custom"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(11, 27, 58, 0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-4)",
          zIndex: 2000,
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            padding: "var(--space-6)",
            maxWidth: "440px",
            width: "100%",
            color: "var(--text-primary)",
            position: "relative",
          }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-lg)" }}>
                Maintenance Payment
              </h4>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                Billing Cycle: {order.month || "Current Period"}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "6px",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Dues Breakdown */}
          <div
            style={{
              backgroundColor: "var(--bg-canvas)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3) var(--space-4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-4)",
              fontSize: "var(--text-sm)",
            }}
          >
            <div>
              <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "var(--text-xs)" }}>
                Base Fee
              </span>
              <strong className="tabular-nums">{formatCurrency(order.baseAmount || order.amount)}</strong>
            </div>
            {order.penalty > 0 && (
              <div>
                <span style={{ color: "var(--danger)", display: "block", fontSize: "var(--text-xs)" }}>
                  Late Penalty
                </span>
                <strong className="tabular-nums" style={{ color: "var(--danger)" }}>
                  +{formatCurrency(order.penalty)}
                </strong>
              </div>
            )}
            <div>
              <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "var(--text-xs)" }}>
                Total Payable
              </span>
              <strong className="tabular-nums" style={{ color: "var(--accent-text)", fontSize: "var(--text-base)" }}>
                {formatCurrency(order.amount)}
              </strong>
            </div>
          </div>

          {/* Gateway Selector Tabs */}
          <div
            className="d-flex p-1 mb-4"
            style={{
              backgroundColor: "var(--bg-canvas)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              gap: "4px",
            }}
          >
            {[
              { id: "upi", label: "UPI QR", icon: <QrCode size={16} /> },
              { id: "razorpay", label: "Cards & NetBanking", icon: <CreditCard size={16} /> },
            ].map((gw) => (
              <button
                key={gw.id}
                type="button"
                onClick={() => setSelectedGateway(gw.id as any)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: selectedGateway === gw.id ? "var(--accent)" : "transparent",
                  color: selectedGateway === gw.id ? "var(--on-accent)" : "var(--text-secondary)",
                  fontWeight: selectedGateway === gw.id ? 600 : 500,
                  fontSize: "var(--text-xs)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {gw.icon}
                <span>{gw.label}</span>
              </button>
            ))}
          </div>

          {/* QR Display or Card Action */}
          {status === "success" ? (
            <div className="py-5 text-center text-success">
              <CheckCircle size={64} className="mx-auto mb-3" style={{ color: "var(--success)" }} />
              <h4 style={{ fontWeight: 700, color: "var(--success)", marginBottom: "4px" }}>
                Payment Confirmed!
              </h4>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0 }}>
                Updating maintenance records and generating your receipt...
              </p>
            </div>
          ) : selectedGateway === "upi" ? (
            <div className="text-center mb-4">
              <div
                style={{
                  display: "inline-block",
                  padding: "var(--space-3)",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                  opacity: status === "expired" ? 0.3 : 1,
                }}
              >
                <QRCodeCanvas
                  value={order.qrCodeUrl || `upi://pay?pa=society@upi&am=${order.amount}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {status === "expired" ? (
                <div className="mt-3 text-danger d-flex align-items-center justify-content-center gap-2">
                  <AlertCircle size={18} />
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                    QR Code expired. Please close and re-generate.
                  </span>
                </div>
              ) : (
                <div
                  className="mt-3 d-flex align-items-center justify-content-center gap-2"
                  style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}
                >
                  <Clock size={16} />
                  <span>Time remaining:</span>
                  <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {formatTime(timeLeft)}
                  </strong>
                </div>
              )}

              {/* Copy UPI ID */}
              {order.upiId && status === "pending" && (
                <div className="mt-3 d-flex align-items-center justify-content-center gap-2">
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--bg-canvas)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {order.upiId}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="btn-outline-gold"
                    style={{ minHeight: "32px", padding: "0 10px", fontSize: "var(--text-xs)" }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 mb-4">
              <CreditCard size={48} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
                Pay securely with debit/credit card or net banking via payment gateway.
              </p>
              <button
                type="button"
                className="btn-gold w-100"
                onClick={() => {
                  if (order.qrCodeUrl) window.open(order.qrCodeUrl, "_blank");
                }}
              >
                Proceed to Gateway Checkout
              </button>
            </div>
          )}

          {/* Security footnote */}
          <div
            className="d-flex align-items-center justify-content-center gap-2 pt-3 border-top"
            style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}
          >
            <ShieldCheck size={16} style={{ color: "var(--success)" }} />
            <span>256-bit TLS encrypted bank-verified transaction</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpiQrModal;
