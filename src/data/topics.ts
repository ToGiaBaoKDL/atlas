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

export const topics = topicSlugs.map((slug) => ({ slug, label: topicLabels[slug] }));

export const getTopicLabel = (slug: TopicSlug) => topicLabels[slug];
