import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

export const GET: APIRoute = (context) =>
  rss({
    title: "Tô Gia Bảo — Writing",
    description: "Technical writing about data platforms, reliability and applied AI.",
    site: context.site ?? context.url.origin,
    items: [],
    customData: "<language>en</language>",
  });
