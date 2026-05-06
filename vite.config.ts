import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: "es",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) {
            return "vendor-react";
          }

          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }

          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) {
            return "vendor-radix";
          }

          if (id.includes("@floating-ui")) {
            return "vendor-floating";
          }

          if (id.includes("@tanstack/react-table") || id.includes("@tanstack/react-query")) {
            return "vendor-tanstack";
          }

          if (id.includes("date-fns")) {
            return "vendor-date";
          }

          if (id.includes("scheduler")) {
            return "vendor-scheduler";
          }

          if (id.includes("@codemirror") || id.includes("/codemirror/")) {
            return "vendor-editor";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }

          if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("/zod/")) {
            return "vendor-form";
          }

          if (id.includes("axios") || id.includes("socket.io-client")) {
            return "vendor-network";
          }

          if (id.includes("react-hot-toast") || id.includes("sonner") || id.includes("goober") || id.includes("react-remove-scroll") || id.includes("aria-hidden")) {
            return "vendor-toast";
          }

          if (id.includes("zustand")) {
            return "vendor-state";
          }

          if (id.includes("tailwind-merge") || id.includes("class-variance-authority") || id.includes("clsx")) {
            return "vendor-style-utils";
          }

          if (id.includes("framer-motion") || id.includes("react-select") || id.includes("react-datepicker") || id.includes("react-day-picker")) {
            return "vendor-ui-extended";
          }

          if (id.includes("exceljs")) {
            return "vendor-exceljs";
          }

          if (id.includes("html2canvas")) {
            return "vendor-html2canvas";
          }

          if (id.includes("xlsx")) {
            return "vendor-xlsx";
          }

          if (id.includes("jspdf") || id.includes("jspdf-autotable")) {
            return "vendor-pdf";
          }

          if (id.includes("docx")) {
            return "vendor-docx";
          }

          if (id.includes("recharts")) {
            return "vendor-charts";
          }

          if (id.includes("pyodide")) {
            return "vendor-pyodide";
          }

          if (
            id.includes("lodash") ||
            id.includes("date-fns") ||
            id.includes("file-saver") ||
            id.includes("react-dropzone") ||
            id.includes("react-doc-viewer")
          ) {
            return "vendor-heavy";
          }

          return "vendor-misc";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,               // cho phép truy cập từ ngoài
    port: 5173,
    cors: true,
    strictPort: true,
    origin: 'https://7e3b73c17209.ngrok-free.app', // URL ngrok
    headers: {
      'Access-Control-Allow-Origin': '*',           // fix CORS FE
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  },
});
