import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
