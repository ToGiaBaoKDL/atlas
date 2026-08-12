import MarketPulseVisual from "./MarketPulseVisual.astro";
import MiniLakehouseVisual from "./MiniLakehouseVisual.astro";

const projectVisuals = {
  "mini-lakehouse": {
    component: MiniLakehouseVisual,
    label: "Mini Lakehouse hybrid platform boundaries",
  },
  "vn-market-pulse": {
    component: MarketPulseVisual,
    label: "VN Market Pulse responsibility pipeline",
  },
} as const;

export type ProjectVisualId = keyof typeof projectVisuals;

const isProjectVisualId = (projectId: string): projectId is ProjectVisualId =>
  Object.hasOwn(projectVisuals, projectId);

export const getProjectVisual = (projectId: string) => {
  if (!isProjectVisualId(projectId)) {
    throw new Error(`Missing visual configuration for project: ${projectId}`);
  }

  return projectVisuals[projectId];
};
