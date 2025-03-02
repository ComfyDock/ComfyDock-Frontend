export const WS_CONFIG = {
  url: import.meta.env.VITE_API_WS_URL || "ws://localhost:5172/ws",
  fallbackUrl: "ws://localhost:5172/ws"
};