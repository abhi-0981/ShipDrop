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
          if (id.includes("node_modules")) {
            if (
              id.includes("react/") ||
              id.includes("react-dom/") ||
              id.includes("react-router-dom/")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("jspdf") ||
              id.includes("html2canvas") ||
              id.includes("jsbarcode")
            ) {
              return "vendor-pdf";
            }
            if (id.includes("leaflet") || id.includes("react-leaflet")) {
              return "vendor-maps";
            }
            if (id.includes("react-icons") || id.includes("lucide-react")) {
              return "vendor-icons";
            }
          }
        },
      },
    },
  },
});
