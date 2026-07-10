import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.VITE_APP_BASE_PATH || "/",
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("@capacitor")) return "capacitor";
            if (id.includes("firebase")) return "firebase";
            if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("framer-motion")) return "ui-vendor";
            if (id.includes("react") || id.includes("@tanstack")) return "react-vendor";
            return "vendor";
          },
        },
      },
    },
  };
});
