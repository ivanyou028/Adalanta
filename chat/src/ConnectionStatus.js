import { socket } from "./socket";
import React, { useRef, useState, useEffect } from "react";

export default function ConnectionStatus() {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  });

  return (
    <div
      className={`h-6 w-6 rounded-full ${
        connected ? "bg-green-500" : "bg-gray-400"
      }`}
      aria-label={connected ? "Connected" : "Disconnected"}
      title={connected ? "Connected" : "Disconnected"}
    ></div>
  );
}
