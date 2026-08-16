import type { APIRoute } from "astro";
import { getProjects, getPublishedWriting } from "../data/content";
import { getProjectStatusLabel } from "../data/projects";
import { getWritingSeries, writingSeries } from "../data/series";
import { getTopicLabel } from "../data/topics";

// Machine-readable snapshot of the rendered content graph, consumed by the
// Playwright suite so tests assert against the current build instead of
// hardcoded copies of titles, dates and ordering.
export const GET: APIRoute = async () => {
  const [projects, writing] = await Promise.all([getProjects(), getPublishedWriting()]);

  const manifest = {
    generatedAt: new Date().toISOString(),
    projects: projects.map((project) => ({
      id: project.id,
      route: `/projects/${project.id}/`,
      title: project.data.title,
      description: project.data.description,
      outcome: project.data.outcome,
      role: project.data.role,
      period: project.data.period,
      status: project.data.status,
      statusLabel: getProjectStatusLabel(project.data.status),
      featured: project.data.featured,
      order: project.data.order,
      topics: project.data.topics,
      topicLabels: project.data.topics.map(getTopicLabel),
      stack: project.data.stack,
      links: project.data.links,
    })),
    writing: writing.map((entry) => ({
      id: entry.id,
      route: `/writing/${entry.id}/`,
      title: entry.data.title,
      description: entry.data.description,
      publishedAt: entry.data.publishedAt.toISOString(),
      updatedAt: entry.data.updatedAt?.toISOString() ?? null,
      draft: entry.data.draft,
      topics: entry.data.topics,
      topicLabels: entry.data.topics.map(getTopicLabel),
      series: entry.data.series
        ? { ...entry.data.series, totalParts: getWritingSeries(entry.data.series.id).totalParts }
        : null,
    })),
    series: writingSeries.map(({ id, name, description, totalParts }) => ({
      id,
      name,
      description,
      totalParts,
      route: `/writing/series/${id}/`,
    })),
  };

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
