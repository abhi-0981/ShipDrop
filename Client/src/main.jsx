import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />

      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "14px",
            padding: "12px 16px",
            boxShadow:
              "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
            maxWidth: "440px",
          },
          success: {
            duration: 3500,
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #bbf7d0",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #fecaca",
            },
            iconTheme: {
              primary: "#dc2626",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);