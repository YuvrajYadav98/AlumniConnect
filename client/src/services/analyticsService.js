import axiosInstance from "../api/axiosInstance";

export const getAnalyticsOverview = async () => {
  const res = await axiosInstance.get("/admin/analytics/overview");
  return res.data;
};

export const getAlumniByBatch = async () => {
  const res = await axiosInstance.get("/admin/analytics/alumni-by-batch");
  return res.data;
};

export const getAlumniByBranch = async () => {
  const res = await axiosInstance.get("/admin/analytics/alumni-by-branch");
  return res.data;
};

export const getAlumniByCity = async () => {
  const res = await axiosInstance.get("/admin/analytics/alumni-by-city");
  return res.data;
};

export const getAlumniByIndustry = async () => {
  const res = await axiosInstance.get("/admin/analytics/alumni-by-industry");
  return res.data;
};

export const getJobsByCategory = async () => {
  const res = await axiosInstance.get("/admin/analytics/jobs-by-category");
  return res.data;
};

// filters: { from, to, limit }
export const getEventRegistrations = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/analytics/event-registrations", {
    params: filters,
  });
  return res.data;
};

// filters: { from, to }
export const getMonthlyRegistrations = async (filters = {}) => {
  const res = await axiosInstance.get("/admin/analytics/monthly-registrations", {
    params: filters,
  });
  return res.data;
};
