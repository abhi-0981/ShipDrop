import axios from "axios";

const api = axios.create({
  baseURL: "parceldrop-backend.netlify.app/api",
  // baseURL: "http://localhost:5000/api",
});

export default api;