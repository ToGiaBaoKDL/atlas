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

test("mobile project cards show complete visual thumbnails", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, "Mobile-only layout");

  for (const route of ["/", "/projects/"]) {
    await page.goto(route);
    const cards = page.locator(".project-card");
    const previews = cards.locator(".project-card-media");
    await expect(cards).toHaveCount(2);
    await expect(previews).toHaveCount(2);

    for (const preview of await previews.all()) {
      const layout = await preview.evaluate((element) => {
        const frame = element.getBoundingClientRect();
        const content = element.firstElementChild?.getBoundingClientRect();
        return {
          bottom: content?.bottom ?? 0,
          className: element.className,
          frameBottom: frame.bottom,
          frameLeft: frame.left,
          frameRight: frame.right,
          height: frame.height,
          left: content?.left ?? 0,
          overflow: getComputedStyle(element).overflow,
          right: content?.right ?? 0,
        };
      });
      expect(layout.overflow).toBe("hidden");
      expect(layout.height).toBeLessThanOrEqual(300);
      expect(layout.left).toBeGreaterThanOrEqual(layout.frameLeft - 1);
      expect(layout.right).toBeLessThanOrEqual(layout.frameRight + 1);
      expect(layout.bottom, `${route} ${layout.className}`).toBeLessThanOrEqual(
        layout.frameBottom + 1,
      );
    }
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

test("mobile hero previews the platform visual", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, "Mobile-only layout");

  await page.goto("/");
  const visual = await page.locator(".platform-visual").boundingBox();
  const viewportHeight = page.viewportSize()?.height ?? 0;

  expect(visual).not.toBeNull();
  const visualTop = visual?.y ?? 0;
  const visualBottom = visualTop + (visual?.height ?? 0);
  const visibleHeight = Math.max(
    0,
    Math.min(visualBottom, viewportHeight) - Math.max(visualTop, 0),
  );
  expect(visibleHeight).toBeGreaterThanOrEqual(120);
});

test("mobile workflow connectors stay centered", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, "Mobile-only layout");

  for (const [route, selector] of [
    ["/projects/mini-lakehouse/", ".workflow-connector"],
    ["/projects/vn-market-pulse/", ".research-connector"],
  ] as const) {
    await page.goto(route);
    const connector = page.locator(selector).first();
    await connector.scrollIntoViewIfNeeded();
    await expect(connector).toBeVisible();

    const offset = await connector.evaluate((element) => {
      const connectorBox = element.getBoundingClientRect();
      const stageBox = element.closest("li")?.getBoundingClientRect();
      if (!stageBox) return Number.POSITIVE_INFINITY;

      const connectorCenter = connectorBox.left + connectorBox.width / 2;
      const stageCenter = stageBox.left + stageBox.width / 2;
      return Math.abs(connectorCenter - stageCenter);
    });

    expect(offset).toBeLessThanOrEqual(1);
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
