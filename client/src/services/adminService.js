import axiosInstance from "../api/axiosInstance";

export const listUsers = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/users", { params: filters });
  return res.data;
};

export const listPendingUsers = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/users/pending", { params: filters });
  return res.data;
};

export const approveUser = async (userId) => {
  const res = await axiosInstance.patch(`/admin/users/${userId}/approve`);
  return res.data;
};

export const rejectUser = async (userId) => {
  const res = await axiosInstance.patch(`/admin/users/${userId}/reject`);
  return res.data;
};
