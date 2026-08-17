import { site } from "./site";

export const experiences = [
  {
    company: site.employer,
    role: site.role,
    location: "Ho Chi Minh City, Vietnam",
    startDate: "2025-05",
    startLabel: "May 2025",
    summary:
      "Building batch pipelines, lakehouse analytics and AI-assisted internal tools across the platform and operations stack.",
    highlights: [
      "Built batch pipelines syncing MariaDB into a landing–curated–analytics lakehouse with Amazon EMR and AWS Glue, masking PII before curated data and using dbt for analytics-ready models.",
      "Built a FastMCP server powering conversational analytics in Slack, grounded in dbt docs, Lightdash dashboards and semantic-layer metadata for self-service discovery.",
      "Automated MongoDB backup validation and general-ledger lookups with Python and Airflow, eliminating recurring manual effort.",
      "Built GenBI dashboards and monitoring for Airflow, Athena and S3 with Lightdash and dbt, and migrated Timo Metrics from Loki and Grafana to SigNoz.",
      "Delivered Tracking247 for the Customer team: a Streamlit app with Airflow pipelines syncing shipment status into MongoDB, centralising updates and cutting manual follow-up.",
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
