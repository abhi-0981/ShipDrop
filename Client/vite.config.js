import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "esnext",
    minify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (normalized.includes("/node_modules/")) {
            if (
              normalized.includes("/node_modules/react/") ||
              normalized.includes("/node_modules/react-dom/") ||
              normalized.includes("/node_modules/react-router/") ||
              normalized.includes("/node_modules/react-router-dom/") ||
              normalized.includes("/node_modules/scheduler/")
            ) {
              return "vendor-react";
            }
            if (
              normalized.includes("/node_modules/jspdf/") ||
              normalized.includes("/node_modules/html2canvas/") ||
              normalized.includes("/node_modules/jsbarcode/")
            ) {
              return "vendor-pdf";
            }
            if (
              normalized.includes("/node_modules/leaflet/") ||
              normalized.includes("/node_modules/react-leaflet/")
            ) {
              return "vendor-maps";
            }
            if (
              normalized.includes("/node_modules/react-icons/") ||
              normalized.includes("/node_modules/lucide-react/")
            ) {
              return "vendor-icons";
            }
          }
        },
      },
    },
  },
});
