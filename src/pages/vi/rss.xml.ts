import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

export const GET: APIRoute = (context) =>
  rss({
    title: "Tô Gia Bảo — Bài viết",
    description: "Bài viết kỹ thuật về nền tảng dữ liệu, độ tin cậy và AI ứng dụng.",
    site: context.site ?? context.url.origin,
    items: [],
    customData: "<language>vi</language>",
  });
