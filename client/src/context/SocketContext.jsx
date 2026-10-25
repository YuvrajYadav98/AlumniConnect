import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { createSocket } from "../api/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const socketRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  // Maps a peer userId -> true while they're currently typing to us.
  const [typingUserIds, setTypingUserIds] = useState(() => new Set());

  // Connect exactly once per login, disconnect on logout - never leave a
  // socket open for a user who isn't authenticated anymore.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUserIds(new Set());
      setTypingUserIds(new Set());
      return;
    }

    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("online_users", (ids) => {
      setOnlineUserIds(new Set(ids));
    });
    socket.on("user_online", (userId) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    });
    socket.on("user_offline", (userId) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("typing", ({ senderId }) => {
      setTypingUserIds((prev) => new Set(prev).add(senderId));
    });
    socket.on("stop_typing", ({ senderId }) => {
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const isUserOnline = useCallback((userId) => onlineUserIds.has(userId), [onlineUserIds]);
  const isUserTyping = useCallback((userId) => typingUserIds.has(userId), [typingUserIds]);

  const value = {
    socket: socketRef.current,
    isConnected,
    isUserOnline,
    isUserTyping,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
