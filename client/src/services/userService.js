import axiosInstance from "../api/axiosInstance";

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axiosInstance.put("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
