import axiosInstance from "../api/axiosInstance";

export const listAnnouncements = async (filters = {}) => {
  const res = await axiosInstance.get("/announcements", { params: filters });
  return res.data;
};

export const createAnnouncement = async (payload) => {
  const res = await axiosInstance.post("/announcements", payload);
  return res.data;
};

export const deleteAnnouncement = async (id) => {
  const res = await axiosInstance.delete(`/announcements/${id}`);
  return res.data;
};
