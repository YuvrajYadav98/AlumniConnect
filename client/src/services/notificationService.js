import axiosInstance from "../api/axiosInstance";

export const listNotifications = async (filters = {}) => {
  const res = await axiosInstance.get("/notifications", { params: filters });
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await axiosInstance.get("/notifications/unread-count");
  return res.data;
};

export const markNotificationAsRead = async (id) => {
  const res = await axiosInstance.patch(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await axiosInstance.patch("/notifications/read-all");
  return res.data;
};
