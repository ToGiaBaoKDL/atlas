import geistLatinSource from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?inline";
import geistVietnameseSource from "@fontsource-variable/geist/files/geist-vietnamese-wght-normal.woff2?inline";
import geistMonoSource from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?inline";
import { render, type FontLoader } from "takumi-js";
import type { SocialCardInput } from "../data/social-cards";

const cardSize = { width: 1200, height: 630 } as const;
const decodeInlineFont = (source: string) =>
  Buffer.from(source.slice(source.indexOf(",") + 1), "base64");

const geistFonts: FontLoader[] = [
  {
    name: "Geist Latin",
    subsetOf: "Geist",
    subsetRank: 0,
    data: decodeInlineFont(geistLatinSource),
  },
  {
    name: "Geist Vietnamese",
    subsetOf: "Geist",
    subsetRank: 1,
    data: decodeInlineFont(geistVietnameseSource),
  },
  {
    name: "Geist Mono",
    data: decodeInlineFont(geistMonoSource),
  },
];

const escapeMarkup = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  .card {
    position: relative;
    display: grid;
    width: 1200px;
    height: 630px;
    grid-template-columns: minmax(0, 1fr) 324px;
    gap: 44px;
    overflow: hidden;
    border: 28px solid #101310;
    background:
      radial-gradient(circle at 92% 0%, rgba(163, 230, 53, 0.14), transparent 34%),
      repeating-linear-gradient(0deg, transparent 0 31px, rgba(41, 48, 41, 0.45) 31px 32px),
      repeating-linear-gradient(90deg, transparent 0 31px, rgba(41, 48, 41, 0.45) 31px 32px),
      #101310;
    color: #f4f5ef;
    font-family: Geist;
    padding: 38px 44px 26px;
    outline: 1px solid #303831;
    outline-offset: -29px;
  }
  .content { display: flex; min-width: 0; flex-direction: column; }
  .identity { display: flex; align-items: center; gap: 12px; }
  .identity-dot {
    width: 12px;
    height: 12px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #a3e635;
    box-shadow: 0 0 0 6px rgba(163, 230, 53, 0.12);
  }
  .identity strong { font-size: 17px; font-weight: 700; }
  .identity span,
  .eyebrow,
  .rail-label,
  .rail-item,
  .domain {
    font-family: "Geist Mono";
    font-weight: 700;
    letter-spacing: 1.25px;
  }
  .identity span { color: #7f877b; font-size: 11px; }
  .eyebrow { margin-top: 38px; color: #b7ee58; font-size: 12px; }
  h1 {
    display: -webkit-box;
    max-width: 750px;
    overflow: hidden;
    margin: 13px 0 0;
    color: #f4f5ef;
    font-size: 64px;
    font-weight: 700;
    letter-spacing: -2.8px;
    line-height: 1.04;
    overflow-wrap: break-word;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
  .description {
    display: -webkit-box;
    max-width: 760px;
    overflow: hidden;
    margin: auto 0 0;
    color: #aeb4aa;
    font-size: 21px;
    line-height: 1.42;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 32px;
    border-top: 1px solid #303831;
    padding-top: 20px;
  }
  .site { color: #b7ee58; font-family: "Geist Mono"; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; }
  .domain { color: #7f877b; font-size: 10px; }
  .rail { display: flex; min-width: 0; flex-direction: column; border-left: 1px solid #303831; padding-left: 44px; }
  .rail-label { margin-top: 27px; color: #7f877b; font-size: 10px; }
  .rail-rule { height: 1px; margin: 15px 0 32px; background: #303831; }
  .rail-items { display: flex; flex-direction: column; gap: 14px; }
  .rail-item {
    display: flex;
    height: 48px;
    align-items: center;
    gap: 12px;
    border: 1px solid #303831;
    border-radius: 8px;
    background: #151a15;
    color: #aeb4aa;
    font-size: 12px;
    padding: 0 14px;
  }
  .rail-item[data-active] { border-color: #8fce2f; background: #1b2416; color: #f1f3ed; }
  .rail-dot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: #5e675d; }
  .rail-item[data-active] .rail-dot { background: #a3e635; }
`;

export const renderSocialCard = async (input: SocialCardInput) => {
  const railItems = input.railItems
    .map(
      ({ label, active }) =>
        `<div class="rail-item"${active ? " data-active" : ""}><i class="rail-dot"></i>${escapeMarkup(label)}</div>`,
    )
    .join("");
  const domain =
    input.kind === "project" ? "PROJECT / SYSTEM / EVIDENCE" : "WRITING / SYSTEMS / PRACTICE";
  const markup = `
    <main class="card" lang="en">
      <section class="content">
        <div class="identity">
          <i class="identity-dot"></i>
          <strong>${escapeMarkup(input.brand.name)}</strong>
          <span>/ ${escapeMarkup(input.brand.role.toUpperCase())}</span>
        </div>
        <div class="eyebrow">${escapeMarkup(input.eyebrow)}</div>
        <h1>${escapeMarkup(input.title)}</h1>
        <p class="description">${escapeMarkup(input.description)}</p>
        <footer class="footer">
          <span class="site">${escapeMarkup(input.brand.domain.toUpperCase())}</span>
          <span class="domain">${domain}</span>
        </footer>
      </section>
      <aside class="rail">
        <span class="rail-label">${escapeMarkup(input.railLabel)}</span>
        <i class="rail-rule"></i>
        <div class="rail-items">${railItems}</div>
      </aside>
    </main>`;

  return Buffer.from(
    await render(markup, {
      ...cardSize,
      format: "png",
      fonts: geistFonts,
      fontFamilies: ["Geist", "Geist Mono"],
      stylesheets: [styles],
    }),
  );
};
