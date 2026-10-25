import axiosInstance from "../api/axiosInstance";

// Thin wrappers around the auth endpoints. Each resolves to the parsed
// response data, or throws the Axios error for the caller to handle.

export const registerUser = async (data) => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (credentials) => {
  const res = await axiosInstance.post("/auth/login", credentials);
  return res.data;
};

export const logoutUser = async () => {
  const res = await axiosInstance.post("/auth/logout");
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
};
