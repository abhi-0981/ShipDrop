export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5001/api"
    : "https://parceldropadminapi-blond.vercel.app/api");

export default API_BASE_URL;
