import { getCollection, type CollectionEntry } from "astro:content";
import { getWritingSeries, type WritingSeriesId } from "./series";

export const getProjects = async () =>
  (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);

export const getPublishedWriting = async () =>
  (await getCollection("writing", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );

const orderSeriesWriting = (entries: CollectionEntry<"writing">[], seriesId: WritingSeriesId) => {
  const orderedEntries = entries
    .filter(({ data }) => data.series?.id === seriesId)
    .sort((a, b) => (a.data.series?.part ?? 0) - (b.data.series?.part ?? 0));
  const { totalParts } = getWritingSeries(seriesId);
  const parts = orderedEntries.map(({ data }) => data.series?.part ?? 0);

  if (new Set(parts).size !== parts.length || parts.some((part) => part > totalParts)) {
    throw new Error(`Invalid published part sequence for writing series "${seriesId}".`);
  }

  return orderedEntries;
};

export const selectWritingSeries = (
  entries: CollectionEntry<"writing">[],
  seriesId: WritingSeriesId,
) => {
  const series = getWritingSeries(seriesId);
  const seriesEntries = orderSeriesWriting(entries, seriesId);
  const publishedParts = new Set(seriesEntries.flatMap(({ data }) => data.series?.part ?? []));
  const isComplete =
    publishedParts.size === series.totalParts &&
    Array.from({ length: series.totalParts }, (_, index) => index + 1).every((part) =>
      publishedParts.has(part),
    );

  return { series, entries: seriesEntries, isComplete };
};

export const getPublishedWritingSeries = async (seriesId: WritingSeriesId) =>
  selectWritingSeries(await getPublishedWriting(), seriesId);
