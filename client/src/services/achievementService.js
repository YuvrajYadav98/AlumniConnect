import axiosInstance from "../api/axiosInstance";

export const submitAchievement = async (payload) => {
  const res = await axiosInstance.post("/achievements", payload);
  return res.data;
};

export const listMyAchievements = async (filters = {}) => {
  const res = await axiosInstance.get("/achievements/mine", { params: filters });
  return res.data;
};

export const listApprovedAchievementsForUser = async (userId) => {
  const res = await axiosInstance.get(`/achievements/user/${userId}`);
  return res.data;
};

export const getAchievementById = async (id) => {
  const res = await axiosInstance.get(`/achievements/${id}`);
  return res.data;
};

export const deleteMyAchievement = async (id) => {
  const res = await axiosInstance.delete(`/achievements/${id}`);
  return res.data;
};

export const listPendingAchievementsAdmin = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/achievements/pending", { params: filters });
  return res.data;
};

export const approveAchievementAdmin = async (id) => {
  const res = await axiosInstance.put(`/admin/achievements/${id}/approve`);
  return res.data;
};

export const rejectAchievementAdmin = async (id) => {
  const res = await axiosInstance.put(`/admin/achievements/${id}/reject`);
  return res.data;
};
