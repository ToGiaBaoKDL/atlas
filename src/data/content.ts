import { getCollection, type CollectionEntry } from "astro:content";
import {
  getWritingSeries,
  homepageWritingSeries,
  writingSeries,
  type HomepageWritingSeries,
  type WritingSeriesId,
} from "./series";

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
  const parts = orderedEntries.map(({ data }) => data.series?.part ?? 0);

  if (new Set(parts).size !== parts.length) {
    throw new Error(`Writing series "${seriesId}" contains duplicate part numbers.`);
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

export type WritingSeriesSelection = ReturnType<typeof selectWritingSeries>;
export type HomepageWritingSeriesSelection = Omit<WritingSeriesSelection, "series"> & {
  series: HomepageWritingSeries;
};

const selectWritingSeriesGroups = (entries: CollectionEntry<"writing">[]) =>
  writingSeries
    .map(({ id }) => selectWritingSeries(entries, id))
    .filter(({ entries: seriesEntries }) => seriesEntries.length > 0);

export const getWritingCatalog = async () => {
  const entries = await getPublishedWriting();

  return {
    entries,
    series: selectWritingSeriesGroups(entries),
  };
};

export const getHomepageWritingSeries = async () => {
  const catalog = await getWritingCatalog();
  const selectionsById = new Map(
    catalog.series.map((selection) => [selection.series.id, selection]),
  );

  return homepageWritingSeries.flatMap<HomepageWritingSeriesSelection>((series) => {
    const selection = selectionsById.get(series.id);

    if (!selection) return [];

    if (!selection.entries.some(({ data }) => data.series?.part === series.homepage.part)) {
      throw new Error(
        `Homepage part ${series.homepage.part} is not published for writing series "${series.id}".`,
      );
    }

    return [{ ...selection, series }];
  });
};
