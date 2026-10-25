import axiosInstance from "../api/axiosInstance";

// filters: { status, search, branch, graduationYear, industry, city, country, skill, page, limit }
export const getPendingAlumni = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/alumni/pending", { params: filters });
  return res.data;
};

export const getAllAlumni = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/alumni", { params: filters });
  return res.data;
};

export const getAlumniById = async (id) => {
  const res = await axiosInstance.get(`/admin/alumni/${id}`);
  return res.data;
};

export const approveAlumni = async (id) => {
  const res = await axiosInstance.put(`/admin/alumni/${id}/approve`);
  return res.data;
};

export const rejectAlumni = async (id) => {
  const res = await axiosInstance.put(`/admin/alumni/${id}/reject`);
  return res.data;
};

export const deleteAlumni = async (id) => {
  const res = await axiosInstance.delete(`/admin/alumni/${id}`);
  return res.data;
};
