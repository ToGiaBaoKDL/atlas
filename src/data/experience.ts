import { site } from "./site";

export const experiences = [
  {
    company: site.employer,
    role: site.role,
    location: "Ho Chi Minh City, Vietnam",
    startDate: "2025-08",
    startLabel: "Aug 2025",
    summary:
      "Building governed data workflows, analytics systems and internal tools across the platform and operations stack.",
    highlights: [
      "Built ingestion workflows with Amazon EMR and AWS Glue, masking sensitive fields before curated data and using dbt for analytics-ready models.",
      "Delivered an MCP-powered Slack analytics interface grounded in dbt documentation, Lightdash dashboards and semantic-layer metadata.",
      "Automated recurring MongoDB backup validation and general-ledger lookup workflows, replacing two manual operational checks.",
      "Built monitoring for Airflow, Athena and S3, and migrated the observability stack from Loki and Grafana to SigNoz.",
    ],
  },
] as const;

export const education = {
  institution: "University of Science, VNU-HCM",
  degree: "B.Sc. in Data Science",
  location: "Ho Chi Minh City, Vietnam",
  startDate: "2022",
  endDate: "2026",
  gpa: "3.78/4.00",
} as const;
