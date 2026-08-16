interface TopicDefinition {
  slug: string;
  label: string;
  usedIn: readonly ("project" | "writing")[];
}

// Single canonical topic registry. `usedIn` scopes which collections may
// reference a topic; `/topics/[slug]` routes are generated from writing usage.
const topics = [
  { slug: "data-platforms", label: "Data platforms", usedIn: ["project"] },
  { slug: "lakehouse", label: "Lakehouse architecture", usedIn: ["project"] },
  { slug: "orchestration", label: "Orchestration", usedIn: ["project"] },
  { slug: "cloud-infrastructure", label: "Cloud infrastructure", usedIn: ["project", "writing"] },
  { slug: "analytics-engineering", label: "Analytics engineering", usedIn: ["project"] },
  { slug: "reliability", label: "Reliability & delivery", usedIn: ["project"] },
  { slug: "applied-ai", label: "Applied AI", usedIn: ["project", "writing"] },
  { slug: "data-systems", label: "Data systems", usedIn: ["writing"] },
  { slug: "software-design", label: "Software design", usedIn: ["writing"] },
  { slug: "developer-tooling", label: "Developer tooling", usedIn: ["writing"] },
  { slug: "technical-research", label: "Technical research", usedIn: ["writing"] },
] as const satisfies readonly TopicDefinition[];

export type TopicSlug = (typeof topics)[number]["slug"];
type TopicUsage = TopicDefinition["usedIn"][number];

type TopicSlugTuple = readonly [TopicSlug, ...TopicSlug[]];

const nonEmpty = (values: readonly TopicSlug[]): TopicSlugTuple => {
  if (values.length === 0) throw new Error("Topic selection must not be empty.");
  return values as TopicSlugTuple;
};

const usesTopic = (usedIn: readonly string[], usage: TopicUsage) => usedIn.includes(usage);

const usageSlugs = (usage: TopicUsage): TopicSlugTuple =>
  nonEmpty(topics.filter(({ usedIn }) => usesTopic(usedIn, usage)).map(({ slug }) => slug));

export const projectTopicSlugs = usageSlugs("project");

export const writingTopicSlugs = usageSlugs("writing");

export const writingTopics = topics
  .filter(({ usedIn }) => usesTopic(usedIn, "writing"))
  .map(({ slug, label }) => ({ slug, label }));

const topicLabels = new Map(topics.map(({ slug, label }) => [slug, label]));
const topicIds = topics.map(({ slug }) => slug);

if (new Set(topicIds).size !== topicIds.length) {
  throw new Error("Topic slugs must be unique.");
}

export const getTopicLabel = (slug: TopicSlug): string => topicLabels.get(slug) ?? slug;
