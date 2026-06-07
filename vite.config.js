import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { referenceMetadataMockApiPlugin } from "./dev/referenceMetadataMockApiPlugin.js";

export default defineConfig({
  plugins: [react(), referenceMetadataMockApiPlugin()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes('"use client"')) {
          return;
        }

        warn(warning);
      },
    },
  },
});
