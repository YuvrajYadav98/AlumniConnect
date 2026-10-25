import axiosInstance from "../api/axiosInstance";

// filters: { search, when, includeUnpublished, page, limit }
export const listEvents = async (filters = {}) => {
  const res = await axiosInstance.get("/events", { params: filters });
  return res.data;
};

export const getEventById = async (id) => {
  const res = await axiosInstance.get(`/events/${id}`);
  return res.data;
};

export const createEvent = async (payload) => {
  const res = await axiosInstance.post("/events", payload);
  return res.data;
};

export const updateEvent = async (id, payload) => {
  const res = await axiosInstance.put(`/events/${id}`, payload);
  return res.data;
};

export const deleteEvent = async (id) => {
  const res = await axiosInstance.delete(`/events/${id}`);
  return res.data;
};

export const publishEvent = async (id) => {
  const res = await axiosInstance.put(`/events/${id}/publish`);
  return res.data;
};

export const cancelEvent = async (id) => {
  const res = await axiosInstance.put(`/events/${id}/cancel`);
  return res.data;
};

export const uploadEventImage = async (id, file) => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await axiosInstance.put(`/events/${id}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getEventParticipants = async (id, filters = {}) => {
  const res = await axiosInstance.get(`/events/${id}/participants`, { params: filters });
  return res.data;
};

export const registerForEvent = async (id) => {
  const res = await axiosInstance.post(`/events/${id}/register`);
  return res.data;
};

export const cancelEventRegistration = async (id) => {
  const res = await axiosInstance.delete(`/events/${id}/register`);
  return res.data;
};

// filters: { when, page, limit }
export const listMyRegisteredEvents = async (filters = {}) => {
  const res = await axiosInstance.get("/events/registrations/me", { params: filters });
  return res.data;
};
