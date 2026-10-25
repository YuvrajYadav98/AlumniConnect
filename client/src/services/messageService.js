import axiosInstance from "../api/axiosInstance";

export const listConversations = async () => {
  const res = await axiosInstance.get("/messages/conversations");
  return res.data;
};

export const getMessageThread = async (userId, filters = {}) => {
  const res = await axiosInstance.get(`/messages/${userId}`, { params: filters });
  return res.data;
};

// REST fallback for sending - the Messages page prefers the socket, but
// falls back to this if the socket isn't connected.
export const sendMessageRest = async (userId, content) => {
  const res = await axiosInstance.post(`/messages/${userId}`, { content });
  return res.data;
};

export const markThreadRead = async (userId) => {
  const res = await axiosInstance.patch(`/messages/${userId}/read`);
  return res.data;
};
