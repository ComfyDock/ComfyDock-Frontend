import { useEffect, useRef, useState } from "react";

interface UseWebSocketProps {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  pollInterval?: number; // for reconnect attempts
}

export function useWebSocketConnection({
  url,
  onMessage,
  pollInterval = 1000,
}: UseWebSocketProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    console.log("useWebSocketConnection", url);
    function connect() {
      // If a socket is already open, close it before creating a new one
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
          reconnectIntervalRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (onMessage) onMessage(event);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
        handleDisconnect();
      };

      ws.onclose = () => {
        handleDisconnect();
      };
    }

    function handleDisconnect() {
      setConnectionStatus("disconnected");

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (!reconnectIntervalRef.current) {
        reconnectIntervalRef.current = setInterval(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, pollInterval);
      }
    }

    // Initial connect
    connect();

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, []);

  return { connectionStatus };
}
