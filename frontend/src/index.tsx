import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "react-hot-toast";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(15, 23, 42, 0.95)",
          color: "#f8fafc",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "12px",
          backdropFilter: "blur(16px)",
        },
      }}
    />
  </React.StrictMode>
);
