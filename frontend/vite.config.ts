import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiMissing = command === "build" && process.env.VERCEL === "1" &&
    (!env.VITE_API_BASE?.trim() || env.VITE_API_BASE.trim() === "/api");
  if (command === "build" && process.env.VERCEL === "1") {
    const apiBase = env.VITE_API_BASE?.trim();
    if (!apiBase || apiBase === "/api") {
      console.warn("VITE_API_BASE is not configured for a hosted API. Building the frontend preview; login and POS operations require a hosted Laravel API URL.");
    } else {
      let url: URL;
      try {
        url = new URL(apiBase);
      } catch {
        throw new Error("Set VITE_API_BASE in Vercel to your hosted Laravel HTTPS URL including /api.");
      }
      if (
        url.protocol !== "https:" ||
        /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname) ||
        !url.pathname.replace(/\/+$/, "").endsWith("/api") ||
        url.search || url.hash || url.username || url.password
      ) {
        throw new Error("VITE_API_BASE must be a public HTTPS Laravel URL ending in /api, without credentials, query strings, or fragments.");
      }
    }
  }
  return {
    define: { __HOSTED_API_MISSING__: JSON.stringify(apiMissing) },
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 8443,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
