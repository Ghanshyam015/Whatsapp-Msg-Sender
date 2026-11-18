import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, resolve(process.cwd(), "../server"), "");
  const apiTarget = process.env.VITE_API_PROXY_TARGET || `http://localhost:${serverEnv.PORT || 4000}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});