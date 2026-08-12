export const topicSlugs = [
  "data-platforms",
  "lakehouse",
  "orchestration",
  "cloud-infrastructure",
  "analytics-engineering",
  "reliability",
  "applied-ai",
] as const;

export type TopicSlug = (typeof topicSlugs)[number];

const topicLabels: Record<TopicSlug, string> = {
  "data-platforms": "Data Platforms",
  lakehouse: "Lakehouse Architecture",
  orchestration: "Orchestration",
  "cloud-infrastructure": "Cloud Infrastructure",
  "analytics-engineering": "Analytics Engineering",
  reliability: "Reliability & Delivery",
  "applied-ai": "Applied AI",
};

export const getTopicLabel = (slug: TopicSlug) => topicLabels[slug];

export const writingTopics = [
  { slug: "data-systems", label: "Data systems" },
  { slug: "software-design", label: "Software design" },
  { slug: "cloud-infrastructure", label: "Cloud infrastructure" },
  { slug: "applied-ai", label: "Applied AI" },
  { slug: "developer-tooling", label: "Developer tooling" },
  { slug: "technical-research", label: "Technical research" },
] as const;

export type WritingTopicSlug = (typeof writingTopics)[number]["slug"];

const writingTopicLabels = Object.fromEntries(
  writingTopics.map(({ slug, label }) => [slug, label]),
) as Record<WritingTopicSlug, string>;

export const getWritingTopicLabel = (slug: WritingTopicSlug) => writingTopicLabels[slug];
