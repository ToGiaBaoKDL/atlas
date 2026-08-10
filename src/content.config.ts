import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projectSchema = z.object({
  title: z.string(),
  description: z.string(),
  outcome: z.string(),
  lang: z.enum(["en", "vi"]),
  translationKey: z.string(),
  slug: z.string(),
  role: z.string(),
  period: z.string(),
  status: z.enum(["active", "maintained", "completed", "archived"]),
  statusLabel: z.string(),
  featured: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  topics: z.array(z.string()),
  stack: z.array(z.string()),
  links: z.object({
    repository: z.url().optional(),
    demo: z.url().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.{md,mdx}",
    generateId: ({ data }) => `${String(data.lang)}/${String(data.slug)}`,
  }),
  schema: projectSchema,
});

export const collections = { projects };
