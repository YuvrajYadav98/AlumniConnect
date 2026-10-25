import axiosInstance from "../api/axiosInstance";

export const getAdminDashboardStats = async () => {
  const res = await axiosInstance.get("/dashboard/admin");
  return res.data;
};

export const getAlumniDashboardStats = async () => {
  const res = await axiosInstance.get("/dashboard/alumni");
  return res.data;
};

export const getStudentDashboardStats = async () => {
  const res = await axiosInstance.get("/dashboard/student");
  return res.data;
};
