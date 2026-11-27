import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "REACT_APP_"]);
  return {
    plugins: [react()],
    // Keep output dir as "build" so Vercel zero-config keeps working
    build: {
      outDir: "build",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            charts: ["chart.js", "react-chartjs-2"],
            ui: ["framer-motion", "lucide-react"],
          },
        },
      },
    },
    // Accept both VITE_ and REACT_APP_ prefixes — Vercel env var stays REACT_APP_API_URL
    envPrefix: ["VITE_", "REACT_APP_"],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: env.REACT_APP_API_URL || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Polyfill global for libs that use it
      global: "globalThis",
    },
  };
});
