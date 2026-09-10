import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: proxy the PHP backend (run `php -S 127.0.0.1:8799 -t server`) so the SPA
// can call /api and /cms same-origin, exactly like production on beta.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8799",
      "/cms": "http://127.0.0.1:8799",
      "/uploads": "http://127.0.0.1:8799",
    },
  },
});
