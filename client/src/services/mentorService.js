import axiosInstance from "../api/axiosInstance";

// filters: { category, skill, search, page, limit }
export const searchMentors = async (filters = {}) => {
  const res = await axiosInstance.get("/mentors", { params: filters });
  return res.data;
};
