import React, { useState, createContext, useContext, useEffect } from "react";
import { AUTH, SOCKET_SERVER_URL } from "./config";
import io from "socket.io-client";
import { useAuthState } from "react-firebase-hooks/auth";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [user] = useAuthState(AUTH);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const uid = user?.uid ?? null;

    if (uid && !socket) {
      const newSocket = io(SOCKET_SERVER_URL, {
        query: { user: uid },
      });
      setSocket(newSocket);
    } else if (!uid && socket) {
      socket.disconnect();
      setSocket(null);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
