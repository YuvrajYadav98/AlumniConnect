import { io } from "socket.io-client";

// The socket server runs on the same backend as the REST API, just
// without the "/api" prefix - derive one URL from the other so there's
// only a single place (VITE_API_BASE_URL) to configure per environment.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * Creates a new socket connection authenticated via the httpOnly JWT
 * cookie (withCredentials: true sends it automatically, same as axios).
 * Not auto-connected - the caller (SocketContext) controls when to
 * connect/disconnect based on auth state.
 */
export function createSocket() {
  return io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnectionAttempts: 5,
  });
}
