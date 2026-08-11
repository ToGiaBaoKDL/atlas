import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { getWritingTopicLabel } from "../data/topics";
import { site as profile } from "../data/site";

export const GET: APIRoute = async (context) => {
  const entries = (await getCollection("writing", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );

  return rss({
    title: `${profile.name} — Writing`,
    description: "Technical writing on data systems, software design and applied AI.",
    site: context.site ?? context.url.origin,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedAt,
      link: `/writing/${entry.id}/`,
      categories: entry.data.topics.map(getWritingTopicLabel),
      author: profile.email,
    })),
  });
};
