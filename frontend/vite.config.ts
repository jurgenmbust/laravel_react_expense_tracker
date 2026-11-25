import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The browser requests /api on Vite; Vite forwards it to Laravel.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://127.0.0.1:8001" } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
