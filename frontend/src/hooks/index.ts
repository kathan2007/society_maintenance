import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../config/api";
import toast from "react-hot-toast";

type PaymentSuccessPayload = {
  orderId: string;
  transactionId: string;
  amount: number;
};

export function usePaymentSocket(
  orderId: string | null,
  onSuccess: (payload: PaymentSuccessPayload) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.emit("join", orderId);

    socket.on("payment:success", (payload: PaymentSuccessPayload) => {
      toast.success("🎉 Payment confirmed!");
      onSuccess(payload);
    });

    socket.on("connect_error", () => {
      // silent — polling fallback handles this
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, onSuccess]);
}

export function useCountdown(seconds: number, onExpire?: () => void) {
  const countRef = useRef(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const start = useCallback(() => {
    countRef.current = seconds;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      countRef.current -= 1;
      if (countRef.current <= 0) {
        clearInterval(intervalRef.current!);
        onExpireRef.current?.();
      }
    }, 1000);
  }, [seconds]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { start, getCount: () => countRef.current };
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// useState import helper (avoid circular)
import { useState } from "react";
