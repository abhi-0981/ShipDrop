import axios from "axios";

const api = axios.create({
  baseURL: "https://parceldropbackend.vercel.app/",
  // baseURL: "http://localhost:5000/api",
});

export default api;