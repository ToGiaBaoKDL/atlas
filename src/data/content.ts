import { getCollection } from "astro:content";

export const getProjects = async () =>
  (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);

export const getPublishedWriting = async () =>
  (await getCollection("writing", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
