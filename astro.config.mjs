// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

const isBuild = process.env.npm_lifecycle_event === "build";

// https://astro.build/config
export default defineConfig({
  site: "https://github.com/yuanyuanyuan",
  base: isBuild ? "/Long_screenshot_splitting_tool/" : "/",
  integrations: [
    sitemap(),
    robotsTxt({
      policy: [{ userAgent: "*", allow: "/" }],
    }),
  ],
});
