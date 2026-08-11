import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalRoutes = [
  "/",
  "/projects/",
  "/projects/mini-lakehouse/",
  "/projects/vn-market-pulse/",
  "/writing/",
  "/about/",
] as const;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
});

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

for (const route of ["/", "/projects/mini-lakehouse/", "/about/"] as const) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

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

test("mobile navigation opens, links and closes", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 896, "Mobile-only interaction");

  await page.goto("/");
  const openButton = page.getByRole("button", { name: "Open menu" });
  const buttonBox = await openButton.boundingBox();
  expect(buttonBox?.width).toBeLessThanOrEqual(36);
  expect(buttonBox?.height).toBeLessThanOrEqual(36);
  const menuIcon = openButton.locator("svg");
  await expect(menuIcon).toBeVisible();
  expect(
    await menuIcon.evaluate((element) => Number.parseFloat(getComputedStyle(element).strokeWidth)),
  ).toBeGreaterThanOrEqual(2);
  await openButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(openButton).toHaveAttribute("aria-expanded", "true");
  const projectsLink = dialog.getByRole("link", { name: "Projects" });
  const linkFontSize = await projectsLink.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(linkFontSize).toBeLessThanOrEqual(21);
  await projectsLink.click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(dialog).not.toBeVisible();
});

test("homepage showcases every project visual", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".project-showcase")).toHaveCount(2);
  await expect(page.locator(".project-showcase .lakehouse-visual")).toHaveCount(1);
  await expect(page.locator(".project-showcase .research-visual")).toHaveCount(1);
});

test("desktop projects use the motion-safe sticky stack", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) <= 896, "Desktop-only layout");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cards = page.locator(".project-showcase");
  const sectionHeading = page.locator(".projects-band .section-heading");

  await expect(cards).toHaveCount(2);
  await expect(sectionHeading).toHaveCSS("position", "sticky");
  expect(await cards.first().evaluate((element) => getComputedStyle(element).position)).toBe(
    "sticky",
  );
  const stickyOffsets = await cards.evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).top)),
  );
  const cardInsets = await cards.evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).marginInlineStart)),
  );
  expect(stickyOffsets[1]).toBe(stickyOffsets[0]);
  expect(cardInsets[1]).toBeGreaterThan(cardInsets[0]);

  const firstCardHeight = await cards
    .first()
    .evaluate((element) => element.getBoundingClientRect().height);
  const headerHeight = await page
    .locator(".site-header")
    .evaluate((element) => element.getBoundingClientRect().height);
  const availableCenter = (headerHeight + (page.viewportSize()?.height ?? 0)) / 2;
  const cardCenter = stickyOffsets[0] + firstCardHeight / 2;
  expect(Math.abs(cardCenter - availableCenter)).toBeLessThanOrEqual(1);

  await cards.first().scrollIntoViewIfNeeded();
  const headingTop = await sectionHeading.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  expect(Math.abs(headingTop - headerHeight)).toBeLessThanOrEqual(1);

  const writingTop = await page
    .locator(".writing-section")
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    writingTop - (page.viewportSize()?.height ?? 0),
  );
  await page.waitForTimeout(500);
  const lastCardTop = await cards.last().evaluate((element) => element.getBoundingClientRect().top);
  expect(Math.abs(lastCardTop - stickyOffsets[0])).toBeLessThanOrEqual(1);
  await expect(sectionHeading).not.toHaveAttribute("data-sticky-hidden", "");
  await expect(sectionHeading).toHaveCSS("position", "sticky");
  await expect(sectionHeading).toHaveCSS("opacity", "1");

  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    writingTop - (page.viewportSize()?.height ?? 0) + 2,
  );
  await page.waitForTimeout(300);
  const boundaryCardTop = await cards
    .last()
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(boundaryCardTop).toBeLessThanOrEqual(lastCardTop);
  await expect(sectionHeading).toHaveAttribute("data-sticky-hidden", "");
  await expect(sectionHeading).toHaveAttribute("inert", "");
  await expect(sectionHeading).toHaveCSS("position", "sticky");
  await expect(sectionHeading).toHaveCSS("opacity", "0");
});

test("project stack keeps normal flow when sticky motion is unsuitable", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) <= 896, "Desktop-only layout");

  await page.goto("/");
  await expect(page.locator(".project-showcase").first()).toHaveCSS("position", "static");
  await expect(page.locator(".projects-band .section-heading")).toHaveCSS("position", "static");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1024, height: 650 });
  await page.reload();
  await expect(page.locator(".project-showcase").first()).toHaveCSS("position", "static");
});

test("tablet project cards keep a consistent content order", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) <= 640, "Covered by the mobile card layout");

  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");

  for (const card of await page.locator(".project-card-showcase").all()) {
    await expect(card.locator(".project-card-body")).toHaveCSS("order", "1");
    await expect(card.locator(".project-card-media")).toHaveCSS("order", "2");
  }
});

test("mobile project cards show complete visual thumbnails", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, "Mobile-only layout");

  for (const route of ["/", "/projects/"]) {
    await page.goto(route);
    const cards = page.locator(".project-card");
    const previews = cards.locator(".project-card-media");
    await expect(cards).toHaveCount(2);
    await expect(previews).toHaveCount(2);

    for (const preview of await previews.all()) {
      // Project lists use content-visibility to skip off-screen work. Bring each
      // card into the viewport before asserting its responsive presentation.
      await preview.scrollIntoViewIfNeeded();
      const layout = await preview.evaluate((element) => {
        const frameElement = element.querySelector(".visual-frame");
        const contentElement = frameElement?.firstElementChild;
        const frame = frameElement?.getBoundingClientRect();
        const content = contentElement?.getBoundingClientRect();
        return {
          aspectRatio: frameElement ? getComputedStyle(frameElement).aspectRatio : "auto",
          bottom: content?.bottom ?? 0,
          className: element.className,
          frameBottom: frame?.bottom ?? 0,
          frameLeft: frame?.left ?? 0,
          frameRight: frame?.right ?? 0,
          height: frame?.height ?? 0,
          left: content?.left ?? 0,
          overflow: getComputedStyle(element).overflow,
          right: content?.right ?? 0,
          transform: contentElement ? getComputedStyle(contentElement).transform : "none",
        };
      });
      expect(layout.overflow).toBe("hidden");
      expect(layout.aspectRatio, `${route} ${JSON.stringify(layout)}`).not.toBe("auto");
      expect(layout.height, `${route} ${JSON.stringify(layout)}`).toBeLessThanOrEqual(300);
      expect(layout.transform).not.toBe("none");
      expect(layout.left).toBeGreaterThanOrEqual(layout.frameLeft - 1);
      expect(layout.right).toBeLessThanOrEqual(layout.frameRight + 1);
      expect(layout.bottom, `${route} ${layout.className}`).toBeLessThanOrEqual(
        layout.frameBottom + 1,
      );
    }
  }
});

test("project visuals stay full on desktop and use mobile overview frames", async ({ page }) => {
  await page.goto("/");
  const cardVisual = page.locator(".project-card-media .visual-frame").first();
  const cardContent = cardVisual.locator(":scope > *");

  if ((page.viewportSize()?.width ?? 0) > 640) {
    await expect(cardContent).toHaveCSS("transform", "none");
  } else {
    await expect(cardContent).not.toHaveCSS("transform", "none");
  }

  await page.goto("/projects/mini-lakehouse/");
  const caseStudyVisual = page.locator(".visual-frame");
  const caseStudyContent = caseStudyVisual.locator(":scope > *");
  await expect(caseStudyVisual).toHaveCount(1);
  await expect(caseStudyContent).toBeVisible();

  if ((page.viewportSize()?.width ?? 0) > 640) {
    await expect(caseStudyContent).toHaveCSS("transform", "none");
  } else {
    await expect(caseStudyVisual).not.toHaveCSS("aspect-ratio", "auto");
    await expect(caseStudyContent).not.toHaveCSS("transform", "none");
  }
});

test("mobile homepage uses a motion-safe project cover stack", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, "Mobile-only layout");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cards = page.locator(".project-showcase");
  const stickyTop = Number.parseFloat(
    await cards.first().evaluate((element) => getComputedStyle(element).top),
  );
  const viewportHeight = page.viewportSize()?.height ?? 0;

  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toHaveCSS("position", "sticky");
  for (const card of await cards.all()) {
    expect((await card.boundingBox())?.height ?? viewportHeight).toBeLessThan(
      viewportHeight - stickyTop,
    );
  }

  const lastCardDocumentTop = await cards
    .last()
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(({ top }) => window.scrollTo({ top, behavior: "instant" }), {
    top: lastCardDocumentTop - stickyTop,
  });
  await page.waitForTimeout(500);
  const lastCardTop = await cards.last().evaluate((element) => element.getBoundingClientRect().top);
  expect(Math.abs(lastCardTop - stickyTop)).toBeLessThanOrEqual(1);
});

test("mobile hero uses the shared overview frame", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, "Mobile-only layout");

  await page.goto("/");
  const frame = page.locator(".hero-visual .visual-frame");
  const visual = frame.locator(":scope > .signature-figure");

  await expect(frame).not.toHaveCSS("aspect-ratio", "auto");
  await expect(visual).not.toHaveCSS("transform", "none");
  expect((await frame.boundingBox())?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(300);
});

test("mobile overview connectors bridge adjacent stages", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, "Mobile-only layout");

  for (const [route, selector] of [
    ["/projects/mini-lakehouse/", ".workflow-connector"],
    ["/projects/vn-market-pulse/", ".research-connector"],
  ] as const) {
    await page.goto(route);
    const connector = page.locator(selector).first();
    await connector.scrollIntoViewIfNeeded();
    await expect(connector).toBeVisible();

    const offsets = await connector.evaluate((element) => {
      const connectorBox = element.getBoundingClientRect();
      const stage = element.closest("li");
      const nextStage = stage?.nextElementSibling;
      const stageBox = stage?.getBoundingClientRect();
      const nextStageBox = nextStage?.getBoundingClientRect();
      if (!stageBox || !nextStageBox) {
        return { end: Number.POSITIVE_INFINITY, start: Number.POSITIVE_INFINITY, vertical: 0 };
      }

      return {
        start: Math.abs(connectorBox.left - stageBox.right),
        end: Math.abs(connectorBox.right - nextStageBox.left),
        vertical: Math.abs(
          connectorBox.top + connectorBox.height / 2 - (stageBox.top + stageBox.height / 2),
        ),
      };
    });

    expect(offsets.start).toBeLessThanOrEqual(2);
    expect(offsets.end).toBeLessThanOrEqual(2);
    expect(offsets.vertical).toBeLessThanOrEqual(2);
  }
});

test("RSS endpoint is valid XML", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/xml");
  expect(await response.text()).toContain("<rss");
});

test("production SEO metadata is canonical and internally consistent", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://portfolio.example/",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://portfolio.example/social-card.png",
  );
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
    "content",
    "Tô Gia Bảo — Data Engineer",
  );
  const graph = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(graph ?? "{}")["@graph"]).toEqual(
    expect.arrayContaining([expect.objectContaining({ "@type": "Person", name: "Tô Gia Bảo" })]),
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

test("project metadata describes the case study", async ({ page }) => {
  await page.goto("/projects/mini-lakehouse/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="article:tag"]')).not.toHaveCount(0);

  const graph = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(graph ?? "{}")["@graph"]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@type": "SoftwareSourceCode",
        codeRepository: "https://github.com/ToGiaBaoKDL/mini-lakehouse",
      }),
    ]),
  );
});

test("404 stays out of indexable metadata", async ({ page }) => {
  await page.goto("/404.html");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test("resume opens as a PDF", async ({ request }) => {
  const response = await request.get("/resume/togia-bao-resume.pdf");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).byteLength).toBeGreaterThan(10_000);
});

test("homepage visual baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("home.png", {
    animations: "disabled",
    caret: "hide",
    fullPage: false,
  });
});
