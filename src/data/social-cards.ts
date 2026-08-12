import { createHash } from "node:crypto";
import type { CollectionEntry } from "astro:content";
import { getProjectStatusLabel } from "./projects";
import { getWritingSeries } from "./series";
import { site } from "./site";

// Increment when the visual template changes so immutable CDN URLs remain correct.
const SOCIAL_CARD_TEMPLATE_REVISION = 2;

export interface SocialCardInput {
  brand: {
    name: string;
    role: string;
    domain: string;
  };
  kind: "project" | "writing";
  title: string;
  description: string;
  eyebrow: string;
  railLabel: string;
  railItems: Array<{ label: string; active?: boolean }>;
}

type SocialCardContent = Omit<SocialCardInput, "brand">;

export interface SocialCardAsset {
  collection: "projects" | "writing";
  asset: string;
  path: string;
  alt: string;
  input: SocialCardInput;
}

const createAsset = (
  collection: "projects" | "writing",
  slug: string,
  content: SocialCardContent,
) => {
  const input: SocialCardInput = {
    brand: { name: site.name, role: site.role, domain: site.domain },
    ...content,
  };
  const revision = createHash("sha256")
    .update(JSON.stringify({ template: SOCIAL_CARD_TEMPLATE_REVISION, input }))
    .digest("hex")
    .slice(0, 10);
  const asset = `${slug}-${revision}`;

  return {
    collection,
    asset,
    path: `/og/${collection}/${asset}.png`,
    alt: `${input.title} — ${input.kind === "project" ? "Project case study" : "Technical writing"} by ${site.name}`,
    input,
  } satisfies SocialCardAsset;
};

export const getProjectSocialCard = (project: CollectionEntry<"projects">) =>
  createAsset("projects", project.id, {
    kind: "project",
    title: project.data.title,
    description: project.data.outcome,
    eyebrow: `PROJECT CASE STUDY · ${getProjectStatusLabel(project.data.status).toUpperCase()}`,
    railLabel: "CORE STACK",
    railItems: project.data.stack.slice(0, 5).map((label) => ({ label })),
  });

export const getWritingSocialCard = (entry: CollectionEntry<"writing">) => {
  const series = entry.data.series ? getWritingSeries(entry.data.series.id) : undefined;

  return createAsset("writing", entry.id, {
    kind: "writing",
    title: entry.data.title,
    description: entry.data.description,
    eyebrow: series
      ? `${series.name.toUpperCase()} · PART ${String(entry.data.series?.part).padStart(2, "0")}`
      : "TECHNICAL WRITING",
    railLabel: series ? `${series.totalParts}-PART SERIES` : "WRITING",
    railItems: series
      ? Array.from({ length: series.totalParts }, (_, index) => ({
          label: `PART ${String(index + 1).padStart(2, "0")}`,
          active: index + 1 === entry.data.series?.part,
        }))
      : entry.data.topics.slice(0, 4).map((label) => ({ label: label.toUpperCase() })),
  });
};
