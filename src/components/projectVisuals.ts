import MarketPulseVisual from "./MarketPulseVisual.astro";
import MiniLakehouseVisual from "./MiniLakehouseVisual.astro";

export const projectVisuals = {
  "mini-lakehouse": {
    component: MiniLakehouseVisual,
    label: "Mini Lakehouse delivery workflow",
    mobileShape: "wide",
  },
  "vn-market-pulse": {
    component: MarketPulseVisual,
    label: "VN Market Pulse research pipeline",
    mobileShape: "tall",
  },
} as const;

export type ProjectVisualId = keyof typeof projectVisuals;

const isProjectVisualId = (projectId: string): projectId is ProjectVisualId =>
  Object.hasOwn(projectVisuals, projectId);

export const getProjectVisual = (projectId: string) =>
  isProjectVisualId(projectId) ? projectVisuals[projectId] : undefined;
