import axiosInstance from "../api/axiosInstance";

export const sendMentorshipRequest = async (mentorId, payload) => {
  const res = await axiosInstance.post(`/mentorship-requests/${mentorId}`, payload);
  return res.data;
};

export const acceptMentorshipRequest = async (id, mentorNote) => {
  const res = await axiosInstance.put(`/mentorship-requests/${id}/accept`, { mentorNote });
  return res.data;
};

export const rejectMentorshipRequest = async (id, mentorNote) => {
  const res = await axiosInstance.put(`/mentorship-requests/${id}/reject`, { mentorNote });
  return res.data;
};

export const completeMentorship = async (id) => {
  const res = await axiosInstance.put(`/mentorship-requests/${id}/complete`);
  return res.data;
};

export const cancelMentorshipRequest = async (id) => {
  const res = await axiosInstance.delete(`/mentorship-requests/${id}`);
  return res.data;
};

// filters: { status, page, limit }
export const listMyMentorshipRequests = async (filters = {}) => {
  const res = await axiosInstance.get("/mentorship-requests", { params: filters });
  return res.data;
};
