import axiosInstance from "../api/axiosInstance";

export const getMyProfile = async () => {
  const res = await axiosInstance.get("/alumni-profiles/me");
  return res.data;
};

export const createMyProfile = async (data) => {
  const res = await axiosInstance.post("/alumni-profiles/me", data);
  return res.data;
};

export const updateMyProfile = async (data) => {
  const res = await axiosInstance.put("/alumni-profiles/me", data);
  return res.data;
};

export const getProfileByUserId = async (userId) => {
  const res = await axiosInstance.get(`/alumni-profiles/${userId}`);
  return res.data;
};

// filters: { search, name, company, jobTitle, batch, branch, city, industry, skills, sort, page, limit }
export const searchAlumniDirectory = async (filters = {}) => {
  const res = await axiosInstance.get("/alumni-profiles", { params: filters });
  return res.data;
};
