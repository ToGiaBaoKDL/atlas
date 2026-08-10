import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { projectStatuses } from "./data/projects";
import { topicSlugs } from "./data/topics";

const projectSchema = z.object({
  title: z.string(),
  description: z.string(),
  outcome: z.string(),
  role: z.string(),
  period: z.string(),
  status: z.enum(projectStatuses),
  featured: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  topics: z.array(z.enum(topicSlugs)).min(1),
  stack: z.array(z.string()).min(1),
  links: z.object({
    repository: z.url().optional(),
    demo: z.url().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.{md,mdx}",
  }),
  schema: projectSchema,
});

export const collections = { projects };
