import { readFileSync } from "node:fs";
import { validateArtworks } from "./scripts/validate-artworks.ts";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { pwaBuild } from "./scripts/pwa-build.ts";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "validate-artworks",
      buildStart() {
        validateArtworks(
          JSON.parse(readFileSync("src/data/artworks.json", "utf8")),
        );
      },
    },
    pwaBuild(),
  ],
  base: "/personal-art-gallery/",
});
