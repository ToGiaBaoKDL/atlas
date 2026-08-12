interface HomepageSeriesPlacement {
  order: number;
  part: number;
}

interface WritingSeriesDefinition {
  id: string;
  name: string;
  description: string;
  totalParts: number;
  homepage?: HomepageSeriesPlacement;
}

export const writingSeries = [
  {
    id: "replayable-by-design",
    name: "Replayable by Design",
    description:
      "Practical notes on pipelines that can be retried, backfilled and recovered safely.",
    totalParts: 5,
    homepage: { order: 1, part: 1 },
  },
] as const satisfies readonly WritingSeriesDefinition[];

export type WritingSeriesId = (typeof writingSeries)[number]["id"];
type WritingSeries = WritingSeriesDefinition & { id: WritingSeriesId };
export type HomepageWritingSeries = WritingSeries & {
  homepage: HomepageSeriesPlacement;
};

const HOMEPAGE_SERIES_LIMIT = 3;

const seriesIds = writingSeries.map(({ id }) => id);

if (new Set(seriesIds).size !== seriesIds.length) {
  throw new Error("Writing series IDs must be unique.");
}

for (const { id, totalParts } of writingSeries) {
  if (!Number.isInteger(totalParts) || totalParts < 1) {
    throw new Error(`Writing series "${id}" must have a positive integer totalParts.`);
  }
}

const writingSeriesById = Object.fromEntries(
  writingSeries.map((series) => [series.id, series]),
) as Record<WritingSeriesId, WritingSeries>;

export const getWritingSeries = (id: WritingSeriesId) => writingSeriesById[id];
export const getWritingSeriesPath = (id: WritingSeriesId) => `/writing/series/${id}/` as const;

const configuredHomepageSeries = writingSeries
  .filter(
    (series): series is (typeof writingSeries)[number] & HomepageWritingSeries =>
      "homepage" in series,
  )
  .sort((a, b) => a.homepage.order - b.homepage.order);
const homepageOrders = configuredHomepageSeries.map(({ homepage }) => homepage.order);

if (new Set(homepageOrders).size !== homepageOrders.length) {
  throw new Error("Homepage writing series orders must be unique.");
}

for (const { id, totalParts, homepage } of configuredHomepageSeries) {
  if (!Number.isInteger(homepage.order) || homepage.order < 1) {
    throw new Error(`Invalid homepage order for writing series "${id}".`);
  }

  if (!Number.isInteger(homepage.part) || homepage.part < 1 || homepage.part > totalParts) {
    throw new Error(`Invalid homepage part for writing series "${id}".`);
  }
}

export const homepageWritingSeries = configuredHomepageSeries.slice(0, HOMEPAGE_SERIES_LIMIT);
