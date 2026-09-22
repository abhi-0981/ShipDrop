import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://parceldropbackend.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;