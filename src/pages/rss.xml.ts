import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getPublishedWriting } from "../data/content";
import { getTopicLabel } from "../data/topics";
import { site as profile } from "../data/site";

export const GET: APIRoute = async (context) => {
  const entries = await getPublishedWriting();

  return rss({
    title: `${profile.name} — Writing`,
    description: "Technical writing on data systems, software design and applied AI.",
    site: context.site ?? context.url.origin,
    customData: "<language>en-us</language>",
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedAt,
      link: `/writing/${entry.id}/`,
      categories: entry.data.topics.map(getTopicLabel),
      author: profile.email,
    })),
  });
};
