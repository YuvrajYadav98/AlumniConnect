import axios from "axios";

// Base URL is read from the Vite environment variable.
// Set VITE_API_BASE_URL in client/.env (see .env.example)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // The backend sets the JWT as an httpOnly cookie. withCredentials
  // ensures the browser sends that cookie on every request and stores
  // any Set-Cookie response - this is what keeps the user logged in.
  withCredentials: true,
});

export default axiosInstance;
