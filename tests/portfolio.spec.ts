import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { getWritingSeriesPath, homepageWritingSeries } from "../src/data/series";

const replayableArticles = [
  {
    route: "/writing/backfills-are-a-data-model-problem/",
    title: "Backfills Are a Data Model Problem, Not an Airflow Feature",
    part: 1,
    publishedAt: "2026-08-12T00:00:00.000Z",
  },
  {
    route: "/writing/idempotent-writes-are-not-replay-safety/",
    title: "Idempotent Writes Are Not Replay Safety",
    part: 2,
    publishedAt: "2026-08-12T05:30:00.000Z",
  },
  {
    route: "/writing/late-data-without-endless-reprocessing/",
    title: "Late Data Without Endless Reprocessing",
    part: 3,
    publishedAt: "2026-08-12T06:45:00.000Z",
  },
  {
    route: "/writing/validation-is-not-a-publish-protocol/",
    title: "Validation Is Not a Publish Protocol",
    part: 4,
    publishedAt: "2026-08-12T07:25:00.000Z",
  },
  {
    route: "/writing/proving-a-pipeline-is-replayable/",
    title: "Proving a Pipeline Is Replayable",
    part: 5,
    publishedAt: "2026-08-12T08:18:00.000Z",
  },
] as const;
const replayableSeries = homepageWritingSeries[0];
const deliverySeries = homepageWritingSeries[1];
const deliveryArticles = [
  {
    route: "/writing/the-image-is-the-release/",
    title: "The Image Is the Release",
    part: 1,
    publishedAt: "2026-08-13T04:15:00.000Z",
  },
  {
    route: "/writing/a-container-needs-a-runtime-contract/",
    title: "A Container Needs a Runtime Contract",
    part: 2,
    publishedAt: "2026-08-13T07:15:00.000Z",
  },
  {
    route: "/writing/deployment-is-a-state-transition/",
    title: "Deployment Is a State Transition",
    part: 3,
    publishedAt: "2026-08-13T09:15:00.000Z",
  },
  {
    route: "/writing/production-must-confirm-the-release/",
    title: "Production Must Confirm the Release",
    part: 4,
    publishedAt: "2026-08-13T11:15:00.000Z",
  },
] as const;
const writingArticles = [
  ...replayableArticles.map((article) => ({ ...article, series: replayableSeries })),
  ...deliveryArticles.map((article) => ({ ...article, series: deliverySeries })),
] as const;
const firstWritingRoute = replayableArticles[0].route;
const replayableSeriesRoute = getWritingSeriesPath(replayableSeries.id);
const deliverySeriesRoute = getWritingSeriesPath(deliverySeries.id);
const writingSeriesRoutes = homepageWritingSeries.map(({ id }) => getWritingSeriesPath(id));

const criticalRoutes = [
  "/",
  "/projects/",
  "/projects/mini-lakehouse/",
  "/projects/vn-market-pulse/",
  "/writing/",
  ...writingSeriesRoutes,
  ...writingArticles.map(({ route }) => route),
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

for (const route of [
  "/",
  "/projects/mini-lakehouse/",
  "/writing/",
  ...writingArticles.map(({ route }) => route),
  "/about/",
] as const) {
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

test("mobile navigation opens, links and closes", { tag: "@mobile" }, async ({ page }) => {
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
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await expect(page.locator(".project-card-showcase .lakehouse-map")).toHaveCount(1);
  await expect(page.locator(".project-card-showcase .market-map")).toHaveCount(1);
  await expect(page.locator(".hero-visual .product-node li")).toHaveText([
    /Landing/,
    /Curated/,
    /Analytics/,
  ]);
  await expect(page.locator(".hero-visual .platform-capabilities li")).toHaveCount(5);
  await expect(page.locator(".hero-visual .flow-arrow").first()).toHaveCSS(
    "animation-name",
    "visual-flow-pulse",
  );
});

test("homepage writing spotlight advances one article at a time", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: `${replayableSeries.name} articles` });
  const status = page.getByRole("status");
  const controls = page.getByRole("button", {
    name: new RegExp(`article in ${replayableSeries.name}`),
  });

  await expect(status).toHaveText("Part 01 / 05");
  for (const control of await controls.all()) {
    const box = await control.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(36);
    expect(box?.height).toBeLessThanOrEqual(36);
  }
  await expect(
    carousel.getByRole("link", { name: new RegExp(replayableArticles[0].title) }),
  ).toBeVisible();

  await page.getByRole("button", { name: `Next article in ${replayableSeries.name}` }).click();

  await expect(status).toHaveText("Part 02 / 05");
  await expect(
    carousel.getByRole("link", { name: new RegExp(replayableArticles[1].title) }),
  ).toBeVisible();
});

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

test("homepage writing spotlight disables navigation until the card settles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const carousel = page.getByRole("region", { name: `${replayableSeries.name} articles` });
  const next = page.getByRole("button", {
    name: `Next article in ${replayableSeries.name}`,
  });
  const previous = page.getByRole("button", {
    name: `Previous article in ${replayableSeries.name}`,
  });
  const status = page.getByRole("status");

  await next.click();
  await expect(previous).toBeDisabled();
  await expect(next).toBeDisabled();

  await next.evaluate((nextButton) => {
    if (!(nextButton instanceof HTMLButtonElement)) {
      throw new Error("Expected next carousel button");
    }

    nextButton.click();
  });

  expect(await status.textContent()).toBe("Part 02 / 05");
  await expect(previous).toBeEnabled();
  await expect(next).toBeEnabled();

  const selectedArticle = carousel.getByRole("link", {
    name: new RegExp(replayableArticles[1].title),
  });
  await expect
    .poll(
      async () => {
        const [viewportBox, cardBox] = await Promise.all([
          carousel.boundingBox(),
          selectedArticle.boundingBox(),
        ]);
        return Math.abs((cardBox?.x ?? 0) - (viewportBox?.x ?? 0));
      },
      { timeout: 3_000 },
    )
    .toBeLessThanOrEqual(2);
});

test("desktop projects use the motion-safe sticky stack", { tag: "@desktop" }, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cards = page.locator(".project-card-showcase");
  const sectionHeading = page.locator(".projects-band .section-heading");

  expect(await cards.count()).toBeGreaterThan(1);
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
  expect(cardCenter).toBeGreaterThanOrEqual(availableCenter - 1);

  await cards.first().scrollIntoViewIfNeeded();
  const headingTop = await sectionHeading.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  expect(Math.abs(headingTop - headerHeight)).toBeLessThanOrEqual(1);
  const [headingBox, firstCardBox] = await Promise.all([
    sectionHeading.boundingBox(),
    cards.first().boundingBox(),
  ]);
  expect(
    (firstCardBox?.y ?? 0) - ((headingBox?.y ?? 0) + (headingBox?.height ?? 0)),
  ).toBeGreaterThanOrEqual(31);

  const writingTop = await page
    .locator(".writing-section")
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    writingTop - (page.viewportSize()?.height ?? 0),
  );
  await expect
    .poll(() => cards.last().evaluate((element) => element.getBoundingClientRect().top))
    .toBeCloseTo(stickyOffsets[0], 0);
  const lastCardTop = await cards.last().evaluate((element) => element.getBoundingClientRect().top);

  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), writingTop);
  await expect
    .poll(() => sectionHeading.evaluate((element) => element.getBoundingClientRect().bottom))
    .toBeLessThanOrEqual(0);
  await expect
    .poll(() => cards.last().evaluate((element) => element.getBoundingClientRect().top))
    .toBeLessThanOrEqual(lastCardTop);
});

test(
  "project stack keeps normal flow when sticky motion is unsuitable",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".project-card-showcase").first()).toHaveCSS("position", "static");
    await expect(page.locator(".projects-band .section-heading")).toHaveCSS("position", "static");

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1024, height: 650 });
    await page.reload();
    await expect(page.locator(".project-card-showcase").first()).toHaveCSS("position", "static");
  },
);

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
      const visual = media.locator(".visual-frame > *");
      const [bodyBox, mediaBox] = await Promise.all([body.boundingBox(), media.boundingBox()]);

      await expect(media).toBeVisible();
      await expect(media.locator(".visual-frame")).not.toHaveCSS("aspect-ratio", "auto");
      await expect(visual).not.toHaveCSS("transform", "none");
      expect((bodyBox?.x ?? Number.POSITIVE_INFINITY) + (bodyBox?.width ?? 0)).toBeLessThan(
        mediaBox?.x ?? 0,
      );
    }
  },
);

test(
  "mobile project cards show complete visual thumbnails",
  { tag: "@mobile" },
  async ({ page }) => {
    for (const route of ["/", "/projects/"]) {
      await page.goto(route);
      const cards = page.locator(".project-card");
      expect(await cards.count()).toBeGreaterThan(0);

      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        const preview = card.locator(".project-card-media");
        const body = card.locator(".project-card-body");
        const [previewBox, bodyBox] = await Promise.all([
          preview.boundingBox(),
          body.boundingBox(),
        ]);
        expect(
          (previewBox?.y ?? Number.POSITIVE_INFINITY) + (previewBox?.height ?? 0),
        ).toBeLessThanOrEqual((bodyBox?.y ?? 0) + 1);

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
  },
);

test("project cards use overviews while case studies keep desktop detail", async ({ page }) => {
  await page.goto("/");
  const cardVisual = page.locator(".project-card-media .visual-frame").first();
  const cardContent = cardVisual.locator(":scope > *");

  await expect(cardVisual).not.toHaveCSS("aspect-ratio", "auto");
  await expect(cardContent).not.toHaveCSS("transform", "none");

  await page.goto("/projects/mini-lakehouse/");
  const caseStudyVisual = page.locator(".project-cover-visual .visual-frame");
  const caseStudyContent = caseStudyVisual.locator(":scope > *");
  await expect(caseStudyVisual).toHaveCount(1);
  await expect(caseStudyContent).toBeVisible();

  if ((page.viewportSize()?.width ?? 0) > 640) {
    await expect(caseStudyVisual).toHaveCSS("aspect-ratio", "auto");
    await expect(caseStudyContent).toHaveCSS("aspect-ratio", "auto");
    await expect(caseStudyContent).toHaveCSS("transform", "none");
  } else {
    await expect(caseStudyVisual).not.toHaveCSS("aspect-ratio", "auto");
    await expect(caseStudyContent).not.toHaveCSS("transform", "none");
  }
});

test("technical visual canvases do not clip their internal layouts", async ({ page }) => {
  for (const route of [
    "/",
    "/projects/",
    "/projects/mini-lakehouse/",
    "/projects/vn-market-pulse/",
    ...writingArticles.map(({ route }) => route),
  ]) {
    await page.goto(route);
    const canvases = page.locator(".lakehouse-map, .market-map, .technical-figure-panel");

    for (const canvas of await canvases.all()) {
      await canvas.scrollIntoViewIfNeeded();
      const box = await canvas.evaluate((element) => ({
        className: element.className,
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        title: element.querySelector(".visual-header strong")?.textContent,
      }));

      expect(box.scrollWidth, `${route} ${JSON.stringify(box)}`).toBeLessThanOrEqual(
        box.clientWidth + 1,
      );
      expect(box.scrollHeight, `${route} ${JSON.stringify(box)}`).toBeLessThanOrEqual(
        box.clientHeight + 1,
      );
    }
  }
});

test("mini lakehouse visual keeps deployment and data boundaries explicit", async ({ page }) => {
  await page.goto("/projects/mini-lakehouse/");
  const visual = page.locator(".project-cover-visual .lakehouse-map");

  await expect(visual.locator(".data-stage strong")).toHaveText([
    "Batch inputs",
    "Spark ingest",
    "Landing",
    "Curated",
    "Analytics",
  ]);
  await expect(visual.locator(".flow-arrow")).toHaveCount(4);
  await expect(visual.locator(".foundation")).toContainText("Terraform");
  await expect(visual.locator(".foundation")).toContainText("Cloudflare Tunnel");
  await expect(visual.locator(".foundation")).not.toContainText("Glue");
  await expect(visual.locator(".serving-lane")).toContainText("Remote OCR service");
});

test("market pulse visual keeps a compact, explicit responsibility path", async ({ page }) => {
  await page.goto("/projects/vn-market-pulse/");
  const visual = page.locator(".project-cover-visual .market-map");

  await expect(visual.locator("article strong")).toHaveText([
    "Request",
    "Plan",
    "Retrieve",
    "Ground",
    "Write",
    "Post",
  ]);
  await expect(visual.locator(".flow-arrow")).toHaveCount(5);

  const clippedOwnerLabels = await visual
    .locator(".stage div small")
    .evaluateAll((labels) =>
      labels
        .filter((label) => label.scrollWidth > label.clientWidth + 1)
        .map((label) => label.textContent),
    );
  expect(clippedOwnerLabels).toEqual([]);

  const comparison = page.locator(".technical-figure").filter({ hasText: "Fewer stages" });
  await comparison.scrollIntoViewIfNeeded();
  const [earlier, current] = await Promise.all([
    comparison.locator(".earlier").boundingBox(),
    comparison.locator(".current").boundingBox(),
  ]);
  expect(Math.abs((earlier?.height ?? 0) - (current?.height ?? 0))).toBeLessThanOrEqual(1);
});

test(
  "mobile homepage uses a motion-safe project cover stack",
  { tag: "@mobile" },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 402, height: 874 });
    await page.goto("/");
    const cards = page.locator(".project-card-showcase");
    const sectionHeading = page.locator(".projects-band .section-heading");
    const stickyTop = Number.parseFloat(
      await cards.first().evaluate((element) => getComputedStyle(element).top),
    );
    const viewportHeight = page.viewportSize()?.height ?? 0;

    expect(await cards.count()).toBeGreaterThan(1);
    await expect(cards.first()).toHaveCSS("position", "sticky");
    await expect(sectionHeading).toHaveCSS("position", "sticky");
    for (const card of await cards.all()) {
      expect((await card.boundingBox())?.height ?? viewportHeight).toBeLessThan(
        viewportHeight - stickyTop,
      );
    }

    const firstCardDocumentTop = await cards
      .first()
      .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    await page.evaluate(({ top }) => window.scrollTo({ top, behavior: "instant" }), {
      top: firstCardDocumentTop - stickyTop,
    });
    await expect
      .poll(() => cards.first().evaluate((element) => element.getBoundingClientRect().top))
      .toBeCloseTo(stickyTop, 0);

    const [headerBox, headingBox, firstCardBox] = await Promise.all([
      page.locator(".site-header").boundingBox(),
      sectionHeading.boundingBox(),
      cards.first().boundingBox(),
    ]);
    expect(Math.abs((headingBox?.y ?? 0) - (headerBox?.height ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((firstCardBox?.y ?? 0) - stickyTop)).toBeLessThanOrEqual(1);
    expect(
      (firstCardBox?.y ?? 0) - ((headingBox?.y ?? 0) + (headingBox?.height ?? 0)),
    ).toBeGreaterThanOrEqual(10);

    const lastCardDocumentTop = await cards
      .last()
      .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    await page.evaluate(({ top }) => window.scrollTo({ top, behavior: "instant" }), {
      top: lastCardDocumentTop - stickyTop,
    });
    await expect
      .poll(() => cards.last().evaluate((element) => element.getBoundingClientRect().top))
      .toBeCloseTo(stickyTop, 0);
    const finalHeadingTop = await sectionHeading.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    expect(Math.abs(finalHeadingTop - (headerBox?.height ?? 0))).toBeLessThanOrEqual(1);
  },
);

test("mobile hero uses the shared overview frame", { tag: "@mobile" }, async ({ page }) => {
  await page.goto("/");
  const frame = page.locator(".hero-visual .visual-frame");
  const visual = frame.locator(":scope > .signature-figure");

  await expect(frame).not.toHaveCSS("aspect-ratio", "auto");
  await expect(visual).not.toHaveCSS("transform", "none");
  expect((await frame.boundingBox())?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(300);
});

test(
  "mobile inline case-study visuals use complete overview frames",
  { tag: "@mobile" },
  async ({ page }) => {
    for (const route of ["/projects/mini-lakehouse/", "/projects/vn-market-pulse/"] as const) {
      await page.goto(route);
      const figures = page.locator(".technical-figure");
      await expect(figures).not.toHaveCount(0);

      for (const figure of await figures.all()) {
        await figure.scrollIntoViewIfNeeded();
        const frame = figure.locator(".visual-frame");
        const content = frame.locator(":scope > *");
        await expect(frame).not.toHaveCSS("aspect-ratio", "auto");
        await expect(content).not.toHaveCSS("transform", "none");

        const [frameBox, contentBox] = await Promise.all([
          frame.boundingBox(),
          content.boundingBox(),
        ]);
        expect(contentBox?.x ?? 0).toBeGreaterThanOrEqual((frameBox?.x ?? 0) - 1);
        expect((contentBox?.x ?? 0) + (contentBox?.width ?? 0)).toBeLessThanOrEqual(
          (frameBox?.x ?? 0) + (frameBox?.width ?? 0) + 1,
        );
        expect((contentBox?.y ?? 0) + (contentBox?.height ?? 0)).toBeLessThanOrEqual(
          (frameBox?.y ?? 0) + (frameBox?.height ?? 0) + 1,
        );
      }
    }
  },
);

test("RSS endpoint is valid XML", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/xml");
  expect(await response.text()).toContain("<rss");
});

test("publish boundary keeps its stages aligned", async ({ page }) => {
  await page.goto(firstWritingRoute);
  const attemptHeights = await page
    .locator(".attempt-path")
    .evaluateAll((paths) =>
      paths.map((path) =>
        Array.from(
          path.querySelectorAll("article"),
          (stage) => stage.getBoundingClientRect().height,
        ),
      ),
    );
  for (const heights of attemptHeights) {
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  }
});

for (const article of writingArticles) {
  test(`${article.route} exposes its date, series and article metadata`, async ({ page }) => {
    await page.goto(article.route);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(article.title);
    await expect(page.locator(".article-hero time").first()).toHaveAttribute(
      "datetime",
      article.publishedAt,
    );
    await expect(page.locator(".article-hero .section-kicker")).toHaveText(
      `${article.series.name} · Part ${String(article.part).padStart(2, "0")}`,
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
            name: article.series.name,
          }),
          position: article.part,
        }),
      ]),
    );
  });
}

test("writing series is ordered and has explicit continuation", async ({ page }) => {
  await page.goto("/writing/");
  await expect(page.getByRole("link", { name: new RegExp(replayableSeries.name) })).toHaveAttribute(
    "href",
    replayableSeriesRoute,
  );

  await page.goto(replayableSeriesRoute);
  const series = page.getByRole("region", { name: `${replayableSeries.name} articles` });

  await expect(series.getByText(`Complete · ${replayableSeries.totalParts} parts`)).toBeVisible();
  await expect(series.locator("ol").getByRole("heading", { level: 2 })).toHaveText(
    replayableArticles.map(({ title }) => title),
  );

  await page.goto(firstWritingRoute);
  const navigation = page.getByRole("navigation", {
    name: `${replayableSeries.name} series navigation`,
  });
  await expect(navigation.getByRole("link", { name: replayableSeries.name })).toHaveAttribute(
    "href",
    replayableSeriesRoute,
  );
  await expect(navigation.getByRole("link", { name: /Previous part/ })).toHaveCount(0);
  await expect(
    navigation.getByRole("link", { name: new RegExp(`Next part.*${replayableArticles[1].title}`) }),
  ).toHaveAttribute("href", replayableArticles[1].route);

  await page.goto(deliverySeriesRoute);
  const delivery = page.getByRole("region", { name: `${deliverySeries.name} articles` });

  await expect(delivery.getByText(`Complete · ${deliverySeries.totalParts} parts`)).toBeVisible();
  await expect(delivery.locator("ol").getByRole("heading", { level: 2 })).toHaveText(
    deliveryArticles.map(({ title }) => title),
  );

  const finalDeliveryArticle = deliveryArticles[deliveryArticles.length - 1];
  await page.goto(finalDeliveryArticle.route);
  const finalNavigation = page.getByRole("navigation", {
    name: `${deliverySeries.name} series navigation`,
  });
  await expect(finalNavigation.getByRole("link", { name: /Previous part/ })).toHaveAttribute(
    "href",
    deliveryArticles[deliveryArticles.length - 2].route,
  );
  await expect(finalNavigation.getByRole("link", { name: /Next part/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Related writing" })).toHaveCount(0);
});

test(
  "mobile series navigation keeps previous and next at opposite edges",
  { tag: "@mobile" },
  async ({ page }) => {
    await page.goto(deliveryArticles[1].route);
    const navigation = page.getByRole("navigation", {
      name: `${deliverySeries.name} series navigation`,
    });
    const previous = navigation.getByRole("link", { name: /Previous part/ });
    const next = navigation.getByRole("link", { name: /Next part/ });
    const [previousBox, previousTitleBox, nextBox, nextTitleBox, previousAlignment, nextAlignment] =
      await Promise.all([
        previous.boundingBox(),
        previous.locator("strong").boundingBox(),
        next.boundingBox(),
        next.locator("strong").boundingBox(),
        previous.evaluate((element) => getComputedStyle(element).textAlign),
        next.evaluate((element) => getComputedStyle(element).textAlign),
      ]);

    expect(["left", "start"]).toContain(previousAlignment);
    expect(nextAlignment).toBe("right");
    expect(previousTitleBox?.x ?? 0).toBeLessThanOrEqual((previousBox?.x ?? 0) + 17);
    expect((nextTitleBox?.x ?? 0) + (nextTitleBox?.width ?? 0)).toBeGreaterThanOrEqual(
      (nextBox?.x ?? 0) + (nextBox?.width ?? 0) - 17,
    );
  },
);

test("content pages publish dedicated PNG social cards", async ({ page, request }) => {
  for (const route of [firstWritingRoute, "/projects/mini-lakehouse/"] as const) {
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
