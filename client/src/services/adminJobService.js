import axiosInstance from "../api/axiosInstance";

export const listPendingJobsAdmin = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/jobs/pending", { params: filters });
  return res.data;
};

export const listAllJobsAdmin = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/jobs", { params: filters });
  return res.data;
};

export const approveJobAdmin = async (id) => {
  const res = await axiosInstance.put(`/admin/jobs/${id}/approve`);
  return res.data;
};

export const rejectJobAdmin = async (id, reason) => {
  const res = await axiosInstance.put(`/admin/jobs/${id}/reject`, { reason });
  return res.data;
};

export const deleteExpiredJobsAdmin = async () => {
  const res = await axiosInstance.delete("/admin/jobs/expired");
  return res.data;
};
