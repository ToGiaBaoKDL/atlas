import type { Locale } from "./site";

type Topic = {
  slug: string;
  label: Record<Locale, string>;
};

export const topics: Topic[] = [
  { slug: "data-platforms", label: { en: "Data Platforms", vi: "Nền tảng dữ liệu" } },
  { slug: "lakehouse", label: { en: "Lakehouse Architecture", vi: "Kiến trúc Lakehouse" } },
  { slug: "orchestration", label: { en: "Orchestration", vi: "Điều phối" } },
  {
    slug: "cloud-infrastructure",
    label: { en: "Cloud Infrastructure", vi: "Hạ tầng Cloud" },
  },
  {
    slug: "analytics-engineering",
    label: { en: "Analytics Engineering", vi: "Analytics Engineering" },
  },
  { slug: "reliability", label: { en: "Reliability & Delivery", vi: "Độ tin cậy & Triển khai" } },
  { slug: "applied-ai", label: { en: "Applied AI", vi: "AI ứng dụng" } },
];
