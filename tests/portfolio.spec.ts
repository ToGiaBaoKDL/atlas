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
  expect(buttonBox?.width).toBeLessThanOrEqual(40);
  expect(buttonBox?.height).toBeLessThanOrEqual(40);
  await openButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(openButton).toHaveAttribute("aria-expanded", "true");
  const projectsLink = dialog.getByRole("link", { name: "Projects" });
  const linkFontSize = await projectsLink.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(linkFontSize).toBeLessThanOrEqual(25);
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
