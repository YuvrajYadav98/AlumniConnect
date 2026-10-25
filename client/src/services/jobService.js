import axiosInstance from "../api/axiosInstance";

// filters: { search, jobType, location, skill, experience, includeExpired, page, limit }
export const listJobs = async (filters = {}) => {
  const res = await axiosInstance.get("/jobs", { params: filters });
  return res.data;
};

export const getJobById = async (id) => {
  const res = await axiosInstance.get(`/jobs/${id}`);
  return res.data;
};

export const createJob = async (payload) => {
  const res = await axiosInstance.post("/jobs", payload);
  return res.data;
};

export const updateJob = async (id, payload) => {
  const res = await axiosInstance.put(`/jobs/${id}`, payload);
  return res.data;
};

export const deleteJob = async (id) => {
  const res = await axiosInstance.delete(`/jobs/${id}`);
  return res.data;
};

export const closeJob = async (id) => {
  const res = await axiosInstance.put(`/jobs/${id}/close`);
  return res.data;
};

export const reopenJob = async (id) => {
  const res = await axiosInstance.put(`/jobs/${id}/reopen`);
  return res.data;
};

export const listMyPostedJobs = async (filters = {}) => {
  const res = await axiosInstance.get("/jobs/mine", { params: filters });
  return res.data;
};

export const saveJob = async (id) => {
  const res = await axiosInstance.post(`/jobs/${id}/save`);
  return res.data;
};

export const unsaveJob = async (id) => {
  const res = await axiosInstance.delete(`/jobs/${id}/save`);
  return res.data;
};

export const listSavedJobs = async (filters = {}) => {
  const res = await axiosInstance.get("/jobs/saved", { params: filters });
  return res.data;
};

export const applyToJob = async (id) => {
  const res = await axiosInstance.post(`/jobs/${id}/apply`);
  return res.data;
};
