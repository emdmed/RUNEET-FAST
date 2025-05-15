import { useEffect, useRef } from "react";

export function useScriptWebSocket(scriptId: string, onMessage: (msg: any) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!scriptId) return;

    const socket = new WebSocket("ws://localhost:3002");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send(JSON.stringify({
        type: "register",
        scriptId: scriptId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("WebSocket message:", msg);
        onMessage(msg);
      } catch (err) {
        console.error("Error parsing WebSocket message", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      socket.close();
    };
  }, [scriptId, onMessage]);

  return socketRef;
}
