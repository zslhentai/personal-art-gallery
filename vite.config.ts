import { readFileSync } from "node:fs";
import { validateArtists } from "./scripts/validate-artists.ts";
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
        const artworks = JSON.parse(readFileSync("src/data/artworks.json", "utf8"));
        validateArtworks(artworks);
        validateArtists(JSON.parse(readFileSync("src/data/artists.json", "utf8")), artworks);
      },
    },
    pwaBuild(),
  ],
  base: "/personal-art-gallery/",
});
