export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];

export const site = {
  name: "Tô Gia Bảo",
  shortName: "TGB",
  email: "baokdl2226@gmail.com",
  github: "https://github.com/ToGiaBaoKDL",
  linkedin: "https://www.linkedin.com/in/togiabao",
  resume: "/resume/togia-bao-resume.pdf",
} as const;

export const ui = {
  en: {
    localeName: "English",
    navigationLabel: "Primary navigation",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    themeToggle: "Toggle color theme",
    skip: "Skip to content",
    nav: { work: "Work", writing: "Writing", notes: "Notes", about: "About" },
    footer: "Designed and built by Tô Gia Bảo.",
  },
  vi: {
    localeName: "Tiếng Việt",
    navigationLabel: "Điều hướng chính",
    menuOpen: "Mở menu",
    menuClose: "Đóng menu",
    themeToggle: "Đổi giao diện sáng tối",
    skip: "Đi đến nội dung",
    nav: { work: "Dự án", writing: "Bài viết", notes: "Ghi chú", about: "Giới thiệu" },
    footer: "Thiết kế và xây dựng bởi Tô Gia Bảo.",
  },
} as const;

export function localizedPath(locale: Locale, path = "/") {
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  const prefix = locale === "vi" ? "/vi" : "";
  return `${prefix}${clean || "/"}${clean ? "/" : ""}`;
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "en" ? "vi" : "en";
}
