import axiosInstance from "../api/axiosInstance";

export const sendConnectionRequest = async (userId) => {
  const res = await axiosInstance.post(`/connections/${userId}`);
  return res.data;
};

export const getConnectionStatus = async (userId) => {
  const res = await axiosInstance.get(`/connections/status/${userId}`);
  return res.data;
};

export const acceptConnectionRequest = async (connectionId) => {
  const res = await axiosInstance.put(`/connections/${connectionId}/accept`);
  return res.data;
};

export const rejectConnectionRequest = async (connectionId) => {
  const res = await axiosInstance.put(`/connections/${connectionId}/reject`);
  return res.data;
};

// Used for both "cancel a request I sent" and "remove an accepted connection" -
// the backend distinguishes based on the connection's current status.
export const deleteConnection = async (connectionId) => {
  const res = await axiosInstance.delete(`/connections/${connectionId}`);
  return res.data;
};

export const blockUser = async (userId) => {
  const res = await axiosInstance.put(`/connections/block/${userId}`);
  return res.data;
};

export const listConnections = async (filters = {}) => {
  const res = await axiosInstance.get("/connections", { params: filters });
  return res.data;
};

// type: "received" (default) | "sent"
export const listPendingRequests = async (type = "received", filters = {}) => {
  const res = await axiosInstance.get("/connections/pending", {
    params: { type, ...filters },
  });
  return res.data;
};
