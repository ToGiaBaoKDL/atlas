export const projectStatuses = ["active", "maintained", "completed", "archived"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

const projectStatusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  maintained: "Deployed & maintained",
  completed: "Completed",
  archived: "Archived",
};

export const getProjectStatusLabel = (status: ProjectStatus) => projectStatusLabels[status];
