export const writingSeries = [
  {
    id: "replayable-by-design",
    name: "Replayable by Design",
    description:
      "Practical notes on pipelines that can be retried, backfilled and recovered safely.",
    totalParts: 5,
    featured: true,
  },
] as const;

export type WritingSeriesId = (typeof writingSeries)[number]["id"];

const writingSeriesById = Object.fromEntries(
  writingSeries.map((series) => [series.id, series]),
) as Record<WritingSeriesId, (typeof writingSeries)[number]>;

export const getWritingSeries = (id: WritingSeriesId) => writingSeriesById[id];

const featuredWritingSeriesEntries = writingSeries.filter(({ featured }) => featured);

if (featuredWritingSeriesEntries.length !== 1) {
  throw new Error("Exactly one featured writing series is required.");
}

export const featuredWritingSeries = featuredWritingSeriesEntries[0];
