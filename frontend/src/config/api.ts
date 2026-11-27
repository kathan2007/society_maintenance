// Resolves REACT_APP_API_URL (Vercel env var) or VITE_API_URL for local dev
const env = import.meta.env;
export const API_BASE_URL: string =
  env.REACT_APP_API_URL || env.VITE_API_URL || "http://localhost:5000";

export default API_BASE_URL;
