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
        gutter={8}
        containerStyle={{
          top: 16,
          right: 16,
        }}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "Inter, -apple-system, sans-serif",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 4px 12px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)",
            padding: "10px 14px",
            maxWidth: "380px",
            lineHeight: "1.4",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 4500,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);

// ======================================================
// GLOBAL SMART POINTER DETECTOR
// Automatically ensures any custom element with a React onClick handler,
// actionable attribute, or interactive role displays `cursor: pointer`.
// ======================================================
if (typeof window !== "undefined") {
  document.addEventListener(
    "mouseover",
    (event) => {
      let el = event.target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (
          el.tagName === "BUTTON" ||
          el.tagName === "A" ||
          el.tagName === "SELECT" ||
          el.tagName === "LABEL" ||
          el.tagName === "SUMMARY"
        ) {
          return;
        }

        // Check if element has a React onClick handler attached
        const reactKey = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
        if (reactKey && typeof el[reactKey]?.onClick === "function") {
          if (!el.style.cursor && !el.classList.contains("cursor-not-allowed")) {
            el.style.cursor = "pointer";
          }
          return;
        }

        el = el.parentElement;
      }
    },
    { passive: true }
  );
}