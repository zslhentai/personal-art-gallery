import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
export function pwaBuild(): Plugin {
  return {
    name: "gallery-pwa",
    apply: "build",
    generateBundle(_, bundle) {
      const entry = Object.values(bundle).find(
        (item) => item.type === "chunk" && item.isEntry,
      );
      if (!entry || entry.type !== "chunk")
        throw new Error("Missing gallery entry");
      const code = new Set<string>();
      const visit = (name: string) => {
        if (code.has(name)) return;
        code.add(name);
        const chunk = bundle[name];
        if (chunk.type === "chunk") chunk.imports.forEach(visit);
      };
      visit(entry.fileName);
      // Small backup tools remain usable offline; the art viewer stays on demand.
      for (const item of Object.values(bundle)) {
        if (
          item.type === "chunk" &&
          item.facadeModuleId?.endsWith("/src/MyGallery.tsx")
        )
          visit(item.fileName);
      }
      Object.keys(bundle)
        .filter((name) => name.endsWith(".css"))
        .forEach((name) => code.add(name));
      const local = [
        "manifest.webmanifest",
        "favicon.svg",
        "favicon.ico",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/apple-touch-icon.png",
      ];
      const shell = ["", ...code, ...local].map(
        (path) => `/personal-art-gallery/${path}`,
      );
      const template = readFileSync("scripts/service-worker.js", "utf8");
      const hash = createHash("sha256")
        .update(template)
        .update(readFileSync("index.html"));
      for (const item of Object.values(bundle))
        hash.update(item.type === "chunk" ? item.code : item.source);
      local.forEach((path) => hash.update(readFileSync(`public/${path}`)));
      const worker = template
        .replace(
          "const VERSION = __VERSION__;",
          `const VERSION = ${JSON.stringify(hash.digest("hex").slice(0, 16))};`,
        )
        .replace(
          "const SHELL = __SHELL__;",
          `const SHELL = ${JSON.stringify(shell)};`,
        );
      this.emitFile({ type: "asset", fileName: "sw.js", source: worker });
    },
  };
}
