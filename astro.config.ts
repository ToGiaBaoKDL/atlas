import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import focusableOverflowPlugin from "./src/plugins/satteri-focusable-overflow";

const site = process.env.SITE_URL;

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "always",
  markdown: {
    syntaxHighlight: "prism",
    processor: satteri({ hastPlugins: [focusableOverflowPlugin] }),
  },
  integrations: site ? [sitemap()] : [],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
      ],
    },
  },
});
