import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";
import { homepageWritingSeries } from "../src/data/series";
import { site } from "../src/data/site";

interface ManifestSeries {
  id: string;
  name: string;
  totalParts: number;
}

interface ManifestWriting {
  id: string;
  route: string;
  title: string;
  publishedAt: string;
  series: { id: string; part: number } | null;
}

interface ManifestProject {
  id: string;
  route: string;
  title: string;
  links: { repository?: string; demo?: string };
}

interface ContentManifest {
  projects: ManifestProject[];
  writing: ManifestWriting[];
  series: ManifestSeries[];
}

// The manifest is emitted by the build, so the suite asserts against the
// content actually rendered instead of hardened copies of it.
const manifest = JSON.parse(
  readFileSync(new URL("../dist/content-manifest.json", import.meta.url), "utf-8"),
) as ContentManifest;

const manifestSeriesById = new Map(manifest.series.map((series) => [series.id, series]));

interface WritingArticle {
  route: string;
  title: string;
  publishedAt: string;
  part: number;
  seriesName: string;
}

const articlesForSeries = (seriesId: string): WritingArticle[] =>
  manifest.writing
    .filter(({ series }) => series?.id === seriesId)
    .sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0))
    .map((entry) => ({
      route: entry.route,
      title: entry.title,
      publishedAt: entry.publishedAt,
      part: entry.series?.part ?? 0,
      seriesName: manifestSeriesById.get(seriesId)?.name ?? seriesId,
    }));

const replayableSeries = homepageWritingSeries[0];
const deliverySeries = homepageWritingSeries[1];
const replayableArticles = articlesForSeries(replayableSeries.id);
const deliveryArticles = articlesForSeries(deliverySeries.id);
const publishedSeries = manifest.series.flatMap((series) => {
  const articles = articlesForSeries(series.id);
  return articles.length > 0 ? [{ series, articles, route: `/writing/series/${series.id}/` }] : [];
});
const writingArticles = publishedSeries.flatMap(({ articles }) => articles);

const requireManifest = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`Content manifest is invalid: ${message}`);
};

requireManifest(
  replayableArticles.length === replayableSeries.totalParts,
  `series "${replayableSeries.id}" must publish every part`,
);
requireManifest(
  deliveryArticles.length === deliverySeries.totalParts,
  `series "${deliverySeries.id}" must publish every part`,
);
requireManifest(
  writingArticles.length === manifest.writing.length,
  "every published entry must belong to a configured series",
);
requireManifest(manifest.projects.length > 0, "at least one project must be published");

const partLabel = (part: number, totalParts: number) =>
  `Part ${String(part).padStart(2, "0")} / ${String(totalParts).padStart(2, "0")}`;

const firstWritingRoute = replayableArticles[0].route;
const writingSeriesRoutes = publishedSeries.map(({ route }) => route);
const firstProject = manifest.projects[0];
const projectRoute = (id: string): string => {
  const route = manifest.projects.find((project) => project.id === id)?.route;
  if (!route) throw new Error(`Project "${id}" is missing from the content manifest.`);
  return route;
};

const criticalRoutes = [
  "/",
  "/projects/",
  ...manifest.projects.map(({ route }) => route),
  "/writing/",
  ...writingSeriesRoutes,
  ...manifest.writing.map(({ route }) => route),
  "/about/",
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
});

// ---------------------------------------------------------------------------
// Route health
// ---------------------------------------------------------------------------

for (const route of criticalRoutes) {
  test(`${route} renders without page overflow`, async ({ page }) => {
    const response = await page.goto(route);

    expect(response?.ok()).toBe(true);
    await expect(page.locator("h1")).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
}

for (const route of ["/", firstProject.route, "/writing/", "/about/"]) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("every writing article is accessibility-clean", async ({ page }) => {
  test.setTimeout(90_000);
  for (const { route } of writingArticles) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
});

// ---------------------------------------------------------------------------
// Site chrome
// ---------------------------------------------------------------------------

test("theme preference is visible and persists", async ({ page }) => {
  await page.goto("/");
  const isMobile = (page.viewportSize()?.width ?? 0) <= 896;

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
  }

  const scope = isMobile ? page.getByRole("dialog") : page.locator("header");
  const themeSwitch = scope.getByRole("switch", { name: "Dark theme" });

  await expect(themeSwitch).toBeVisible();
  await themeSwitch.click();
  await expect(themeSwitch).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("mobile navigation opens, links and closes", { tag: "@mobile" }, async ({ page }) => {
  await page.goto("/");
  const openButton = page.getByRole("button", { name: "Open menu" });
  await openButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(openButton).toHaveAttribute("aria-expanded", "true");

  await dialog.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(dialog).not.toBeVisible();
});

test("about owns contact links and the site footer stays minimal", async ({ page }) => {
  await page.goto("/about/");
  const contacts = page.getByRole("navigation", { name: "Contact and social links" });

  await expect(contacts.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", site.github);
  await expect(contacts.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
    "href",
    site.linkedin,
  );
  await expect(contacts.getByRole("link", { name: site.email })).toHaveAttribute(
    "href",
    `mailto:${site.email}`,
  );
  await expect(contacts.getByRole("link", { name: site.phone.label })).toHaveAttribute(
    "href",
    `tel:${site.phone.number}`,
  );

  const footer = page.locator("footer.site-footer");
  await expect(footer.getByRole("link", { name: /GitHub|LinkedIn|Resume|Email/ })).toHaveCount(0);
  await expect(page.locator(".experience-period time")).toHaveAttribute("datetime", "2025-03");
  await expect(page.locator(".experience-period time")).toHaveText("March 2025");
});

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

test("homepage showcases every project visual", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".project-card-showcase");

  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    await expect(card.locator(".project-card-media .visual-frame > *")).toBeVisible();
  }
  await expect(page.locator(".hero-visual .signature-figure")).toBeVisible();
});

test(
  "homepage writing spotlight advances by direct drag",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.goto("/");
    const carousel = page.getByRole("region", { name: `${replayableSeries.name} articles` });
    const status = page.getByRole("status");

    await expect(status).toHaveText(partLabel(1, replayableSeries.totalParts));
    await expect(
      carousel.getByRole("link", { name: new RegExp(replayableArticles[0].title) }),
    ).toBeVisible();

    await carousel.scrollIntoViewIfNeeded();
    const box = await carousel.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const dragY = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.8, dragY);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, dragY, { steps: 10 });
    await page.mouse.up();

    await expect(status).toHaveText(partLabel(2, replayableSeries.totalParts));
    await expect(
      carousel.getByRole("link", { name: new RegExp(replayableArticles[1].title) }),
    ).toBeVisible();
  },
);

test("homepage writing spotlight switches series", async ({ page }) => {
  await page.goto("/");
  const seriesButton = page
    .getByRole("group", { name: "Choose a writing series" })
    .getByRole("button", { name: new RegExp(deliverySeries.name) });

  await seriesButton.click();

  await expect(seriesButton).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("region", { name: `${deliverySeries.name} articles` })
      .getByRole("link", { name: new RegExp(deliveryArticles[0].title) }),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// Sticky project stack
// ---------------------------------------------------------------------------

const projectCards = (page: import("@playwright/test").Page) =>
  page.locator(".project-card-showcase");
const projectsHeading = (page: import("@playwright/test").Page) =>
  page.locator(".projects-band .section-heading");

test("desktop projects use the motion-safe sticky stack", { tag: "@desktop" }, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cards = projectCards(page);
  const heading = projectsHeading(page);

  expect(await cards.count()).toBeGreaterThan(1);
  await expect(heading).toHaveCSS("position", "sticky");
  const stickyOffsets = await cards.evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).top)),
  );
  expect(new Set(stickyOffsets).size).toBe(1);

  // Every card pins at the shared offset when scrolled into place...
  for (const card of await cards.all()) {
    const documentTop = await card.evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    );
    await page.evaluate(({ top }) => window.scrollTo({ top, behavior: "instant" }), {
      top: documentTop - stickyOffsets[0],
    });
    await expect
      .poll(() => card.evaluate((element) => element.getBoundingClientRect().top))
      .toBeCloseTo(stickyOffsets[0], 0);
  }

  // ...past the section, the heading unsticks and the stack collapses.
  const writingTop = await page
    .locator(".writing-section")
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), writingTop);
  await expect
    .poll(() => heading.evaluate((element) => element.getBoundingClientRect().bottom))
    .toBeLessThanOrEqual(0);
});

test(
  "project stack keeps normal flow when sticky motion is unsuitable",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.goto("/");
    await expect(projectCards(page).first()).toHaveCSS("position", "static");
    await expect(projectsHeading(page)).toHaveCSS("position", "static");

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1024, height: 650 });
    await page.reload();
    await expect(projectCards(page).first()).toHaveCSS("position", "static");
  },
);

test(
  "mobile homepage uses a motion-safe project cover stack",
  { tag: "@mobile" },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 402, height: 874 });
    await page.goto("/");
    const cards = projectCards(page);
    const stickyTop = Number.parseFloat(
      await cards.first().evaluate((element) => getComputedStyle(element).top),
    );

    expect(await cards.count()).toBeGreaterThan(1);
    await expect(projectsHeading(page)).toHaveCSS("position", "sticky");
    // Every cover must fit below the pinned heading.
    for (const card of await cards.all()) {
      expect((await card.boundingBox())?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(
        (page.viewportSize()?.height ?? 0) - stickyTop,
      );
    }
    // First and last card both pin at the shared offset.
    for (const card of [cards.first(), cards.last()]) {
      const documentTop = await card.evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
      await page.evaluate(({ top }) => window.scrollTo({ top, behavior: "instant" }), {
        top: documentTop - stickyTop,
      });
      await expect
        .poll(() => card.evaluate((element) => element.getBoundingClientRect().top))
        .toBeCloseTo(stickyTop, 0);
    }
  },
);

// ---------------------------------------------------------------------------
// Responsive visual presentation
// ---------------------------------------------------------------------------

const expectScaledFrame = async (frame: Locator) => {
  await expect(frame).not.toHaveCSS("aspect-ratio", "auto");
  await expect(frame.locator(":scope > *")).not.toHaveCSS("transform", "none");
};

test("mobile visuals stay scaled and inside their frames", { tag: "@mobile" }, async ({ page }) => {
  const scenarios = [
    { route: "/", selector: ".hero-visual .visual-frame" },
    { route: "/", selector: ".project-card .project-card-media .visual-frame" },
    { route: "/projects/", selector: ".project-card .project-card-media .visual-frame" },
    ...manifest.projects.flatMap(({ route }) => [
      { route, selector: ".project-cover-visual .visual-frame" },
      { route, selector: ".technical-figure .visual-frame" },
    ]),
  ];

  for (const { route, selector } of scenarios) {
    await page.goto(route);
    for (const frame of await page.locator(selector).all()) {
      await frame.scrollIntoViewIfNeeded();
      await expectScaledFrame(frame);

      const boxes = await frame.evaluate((element) => {
        const content = element.firstElementChild?.getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        return { content, bounds };
      });
      expect(boxes.content).not.toBeNull();
      expect(boxes.content?.left ?? 0).toBeGreaterThanOrEqual(boxes.bounds.left - 1);
      expect(boxes.content?.right ?? 0).toBeLessThanOrEqual(boxes.bounds.right + 1);
      expect(boxes.content?.bottom ?? 0).toBeLessThanOrEqual(boxes.bounds.bottom + 1);
    }
  }
});

test("desktop case studies keep full-size visuals", { tag: "@desktop" }, async ({ page }) => {
  for (const { route } of manifest.projects) {
    await page.goto(route);
    const frame = page.locator(".project-cover-visual .visual-frame");
    await expect(frame).toBeVisible();
    await expect(frame).toHaveCSS("aspect-ratio", "auto");
    await expect(frame.locator(":scope > *")).toHaveCSS("transform", "none");
  }
});

test(
  "desktop project index pairs content with overview visuals",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.goto("/projects/");
    const cards = page.locator(".project-card-list");
    expect(await cards.count()).toBeGreaterThan(0);

    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      const body = card.locator(".project-card-body");
      const media = card.locator(".project-card-media");
      await expect(media).toBeVisible();
      await expectScaledFrame(media.locator(".visual-frame"));
      const [bodyBox, mediaBox] = await Promise.all([body.boundingBox(), media.boundingBox()]);
      expect((bodyBox?.x ?? Number.POSITIVE_INFINITY) + (bodyBox?.width ?? 0)).toBeLessThan(
        mediaBox?.x ?? 0,
      );
    }
  },
);

test("technical visual canvases do not clip their internal layouts", async ({ page }) => {
  const routes = [
    "/",
    ...manifest.projects.map(({ route }) => route),
    ...writingArticles.map(({ route }) => route),
  ];

  for (const route of routes) {
    await page.goto(route);
    for (const canvas of await page
      .locator(".lakehouse-map, .market-map, .signature-figure, .technical-figure-panel")
      .all()) {
      await canvas.scrollIntoViewIfNeeded();
      const box = await canvas.evaluate((element) => ({
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
      }));

      expect(box.scrollWidth, route).toBeLessThanOrEqual(box.clientWidth + 1);
      expect(box.scrollHeight, route).toBeLessThanOrEqual(box.clientHeight + 1);
    }
  }
});

test("project case-study diagrams keep their documented stages", async ({ page }) => {
  await page.goto(projectRoute("mini-lakehouse"));
  const lakehouse = page.locator(".project-cover-visual .lakehouse-map");
  await expect(lakehouse.locator(".data-stage strong")).toHaveText([
    "Batch inputs",
    "Spark ingest",
    "Landing",
    "Curated",
    "Analytics",
  ]);
  await expect(lakehouse.locator(".flow-arrow")).toHaveCount(4);
  await expect(lakehouse.locator(".foundation")).toContainText("Terraform");
  await expect(lakehouse.locator(".serving-lane")).toContainText("Remote OCR service");

  await page.goto(projectRoute("vn-market-pulse"));
  const market = page.locator(".project-cover-visual .market-map");
  await expect(market.locator("article strong")).toHaveText([
    "Request",
    "Plan",
    "Retrieve",
    "Ground",
    "Write",
    "Post",
  ]);
  await expect(market.locator(".flow-arrow")).toHaveCount(5);
});

// ---------------------------------------------------------------------------
// Content metadata
// ---------------------------------------------------------------------------

for (const article of writingArticles) {
  test(`${article.route} exposes its date, series and article metadata`, async ({ page }) => {
    await page.goto(article.route);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(article.title);
    await expect(page.locator(".article-hero time").first()).toHaveAttribute(
      "datetime",
      article.publishedAt,
    );
    await expect(page.locator(".article-hero .section-kicker")).toHaveText(
      `${article.seriesName} · Part ${String(article.part).padStart(2, "0")}`,
    );
    expect(await page.locator(".technical-figure").count()).toBeGreaterThan(0);
    const figureNumbers = page.locator(".technical-figure figcaption > span");
    for (let index = 0; index < (await figureNumbers.count()); index += 1) {
      await expect(figureNumbers.nth(index)).toHaveText(
        new RegExp(`^${String(article.part).padStart(2, "0")}\\.${index + 1} /`),
      );
    }

    const graph = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(graph ?? "{}")["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "BlogPosting",
          datePublished: article.publishedAt,
          isPartOf: expect.objectContaining({
            "@type": "CreativeWorkSeries",
            name: article.seriesName,
          }),
          position: article.part,
        }),
      ]),
    );
  });
}

test("writing series are ordered and link their continuation", async ({ page }) => {
  for (const { series, articles, route } of publishedSeries) {
    await page.goto("/writing/");
    await expect(page.getByRole("link", { name: new RegExp(series.name) })).toHaveAttribute(
      "href",
      route,
    );

    await page.goto(route);
    const directory = page.getByRole("region", { name: `${series.name} articles` });
    const status =
      articles.length === series.totalParts
        ? `Complete · ${series.totalParts} parts`
        : `In progress · ${articles.length} of ${series.totalParts} parts`;

    await expect(directory.getByText(status)).toBeVisible();
    await expect(directory.locator("ol").getByRole("heading", { level: 2 })).toHaveText(
      articles.map(({ title }) => title),
    );

    await page.goto(articles[0].route);
    const firstNavigation = page.getByRole("navigation", {
      name: `${series.name} series navigation`,
    });
    await expect(firstNavigation.getByRole("link", { name: series.name })).toHaveAttribute(
      "href",
      route,
    );
    await expect(firstNavigation.getByRole("link", { name: /Previous part/ })).toHaveCount(0);
    if (articles[1]) {
      await expect(firstNavigation.getByRole("link", { name: /Next part/ })).toHaveAttribute(
        "href",
        articles[1].route,
      );
    } else {
      await expect(firstNavigation.getByRole("link", { name: /Next part/ })).toHaveCount(0);
    }

    if (articles.length > 1) {
      await page.goto(articles.at(-1)?.route ?? articles[0].route);
      const finalNavigation = page.getByRole("navigation", {
        name: `${series.name} series navigation`,
      });
      await expect(finalNavigation.getByRole("link", { name: /Previous part/ })).toHaveAttribute(
        "href",
        articles.at(-2)?.route ?? "",
      );
      await expect(finalNavigation.getByRole("link", { name: /Next part/ })).toHaveCount(0);
    }
  }
});

test(
  "mobile series navigation anchors previous and next at opposite edges",
  { tag: "@mobile" },
  async ({ page }) => {
    await page.goto(deliveryArticles[1].route);
    const navigation = page.getByRole("navigation", {
      name: `${deliverySeries.name} series navigation`,
    });

    await expect(navigation.getByRole("link", { name: /Previous part/ })).toHaveCSS(
      "text-align",
      /^(left|start)$/,
    );
    await expect(navigation.getByRole("link", { name: /Next part/ })).toHaveCSS(
      "text-align",
      "right",
    );
  },
);

for (const route of [firstWritingRoute, firstProject.route]) {
  test(
    `${route} table of contents tracks the current section`,
    { tag: "@desktop" },
    async ({ page }) => {
      await page.goto(route);
      const tableOfContents = page.locator(".toc-desktop").getByRole("navigation", {
        name: "Table of contents",
      });
      const nextSection = tableOfContents.getByRole("link").nth(1);

      await nextSection.click();
      await expect(nextSection).toHaveAttribute("aria-current", "location");
      await expect(tableOfContents.locator('[aria-current="location"]')).toHaveCount(1);
    },
  );
}

// ---------------------------------------------------------------------------
// SEO, feeds and security
// ---------------------------------------------------------------------------

test("RSS endpoint is valid XML", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/xml");
  expect(await response.text()).toContain("<rss");
});

test("content pages publish dedicated PNG social cards", async ({ page, request }) => {
  for (const route of [firstWritingRoute, firstProject.route]) {
    await page.goto(route);
    const socialImage = await page.locator('meta[property="og:image"]').getAttribute("content");

    expect(socialImage).toBeTruthy();
    const imageUrl = new URL(socialImage ?? "https://portfolio.example/");
    expect(imageUrl.pathname).toMatch(/^\/og\/(writing|projects)\/[a-z0-9-]+-[a-f0-9]{10}\.png$/);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      socialImage ?? "",
    );

    const response = await request.get(imageUrl.pathname);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
    const image = await response.body();
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
  }
});

test("SEO metadata is canonical and internally consistent", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://portfolio.example/",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://portfolio.example/social-card.png",
  );
  const graph = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(graph ?? "{}")["@graph"]).toEqual(
    expect.arrayContaining([expect.objectContaining({ "@type": "Person", name: site.name })]),
  );

  const feed = await (await request.get("/rss.xml")).text();
  const hasPublishedWriting = feed.includes("<item>");
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(
    hasPublishedWriting ? 1 : 0,
  );
  await expect(page.locator("footer").getByRole("link", { name: "RSS" })).toHaveCount(
    hasPublishedWriting ? 1 : 0,
  );

  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).toContain("https://portfolio.example/writing/");
  expect(sitemap).not.toContain("/404");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://portfolio.example/sitemap-index.xml");
});

test("project pages publish article metadata", async ({ page }) => {
  await page.goto(firstProject.route);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="article:tag"]')).not.toHaveCount(0);

  const graph = await page.locator('script[type="application/ld+json"]').textContent();
  const expected = [
    expect.objectContaining({
      "@type": "SoftwareSourceCode",
      name: firstProject.title,
    }),
  ];
  if (firstProject.links.repository) {
    expected.push(
      expect.objectContaining({
        "@type": "SoftwareSourceCode",
        codeRepository: firstProject.links.repository,
      }),
    );
  }
  expect(JSON.parse(graph ?? "{}")["@graph"]).toEqual(expect.arrayContaining(expected));
});

test("404 stays out of indexable metadata", async ({ page }) => {
  await page.goto("/404.html");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test("pages ship a hardened content security policy", async ({ page }) => {
  await page.goto("/");
  const csp = await page
    .locator('meta[http-equiv="content-security-policy"]')
    .getAttribute("content");
  expect(csp).toBeTruthy();
  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ]) {
    expect(csp, `missing "${directive}"`).toContain(directive);
  }
  expect(csp).toMatch(/script-src[^;]*'sha256-/);
  expect(csp).not.toContain("unsafe-inline");
  expect(csp).not.toContain("unsafe-eval");
});

test("security headers are pinned in public/_headers", async () => {
  const headers = readFileSync(new URL("../public/_headers", import.meta.url), "utf-8");
  for (const required of [
    "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: DENY",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Cross-Origin-Opener-Policy: same-origin",
  ]) {
    expect(headers, `missing "${required}"`).toContain(required);
  }
  expect(headers).toContain("X-Robots-Tag: noindex");
});

test("resume serves a real PDF", async ({ request }) => {
  const response = await request.get("/resume/togia-bao-resume.pdf");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).byteLength).toBeGreaterThan(10_000);
});

// ---------------------------------------------------------------------------
// Visual regression
// ---------------------------------------------------------------------------

test("homepage visual baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("home.png", {
    animations: "disabled",
    caret: "hide",
    fullPage: false,
  });
});
