import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { projectStatuses } from "./data/projects";
import { writingSeries } from "./data/series";
import { topicSlugs, writingTopics } from "./data/topics";

const requiredText = z.string().trim().min(1);

const projectSchema = z.object({
  title: requiredText,
  description: requiredText,
  outcome: requiredText,
  role: requiredText,
  period: requiredText,
  status: z.enum(projectStatuses),
  featured: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  topics: z.array(z.enum(topicSlugs)).min(1),
  stack: z.array(requiredText).min(1),
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

const writingTopicSlugs = writingTopics.map(({ slug }) => slug);
const writingSeriesIds = writingSeries.map(({ id }) => id);

const writingSchema = z
  .object({
    title: requiredText,
    description: requiredText,
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    topics: z.array(z.enum(writingTopicSlugs)).min(1),
    series: z
      .object({
        id: z.enum(writingSeriesIds),
        part: z.number().int().positive(),
      })
      .optional(),
  })
  .refine(({ publishedAt, updatedAt }) => !updatedAt || updatedAt >= publishedAt, {
    message: "updatedAt must be on or after publishedAt",
    path: ["updatedAt"],
  });

const writing = defineCollection({
  loader: glob({
    base: "./src/content/writing",
    pattern: "**/*.{md,mdx}",
  }),
  schema: writingSchema,
});

export const collections = { projects, writing };
