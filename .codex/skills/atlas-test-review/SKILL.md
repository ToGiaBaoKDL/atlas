---
name: atlas-test-review
description: Write, review, or simplify lean regression tests for the Atlas Astro portfolio. Use when changing Playwright coverage, fixing a visual or responsive regression, reviewing redundant tests, or deciding whether an Atlas UI, SEO, accessibility, content, or build behavior needs a test.
---

# Atlas Test Review

Protect stable user-facing contracts with the smallest test that would have caught the defect. Prefer durable evidence over broad assertion counts.

## Decide whether to add a test

Add or retain a test when at least one is true:

- It protects a user journey, accessibility requirement, published metadata, or critical asset.
- It reproduces a real layout, responsive, theme, motion, or content regression.
- It verifies repository-specific architecture that ordinary Astro or browser behavior does not guarantee.

Do not test framework behavior, private class structure, raw CSS implementation, or the same outcome already caught by a stronger test. Remove a test when its failure cannot identify a distinct defect.

## Choose one proof per contract

- Use role, label, URL, and visible content locators for user behavior.
- Use bounding boxes or computed styles only for geometry and responsive contracts with no semantic equivalent.
- Use accessibility scans for standards coverage, not as a substitute for interaction tests.
- Use a visual snapshot for composition; pair it with structural assertions only when those assertions diagnose a separate failure.
- Assert exact content counts only when the count is a product requirement. Otherwise assert identity, presence, or derive expectations from source data.

## Keep tests durable

- Test behavior, not CSS declaration choices such as `order`, internal wrapper depth, or incidental class names.
- Keep one scenario focused on one contract. Parameterize routes only when setup and expected behavior are genuinely identical and failures remain readable.
- Avoid arbitrary sleeps. Wait for a locator, attribute, response, or measurable boundary. If animation or sticky settling requires time, keep the wait local and explain why.
- Use project default viewports unless a known regression depends on an exact size.
- Keep reduced-motion and full-motion paths separate when they represent different contracts.
- Do not add production hooks solely for tests unless no accessible or stable observable exists.

## Workflow

1. Read the implementation, related regression history, existing tests, and Playwright configuration.
2. Name the contract and the distinct failure the test must report.
3. Search for existing coverage. Strengthen or simplify it before adding another test.
4. Implement the fewest assertions that prove the contract.
5. Run the focused test in the relevant Playwright project.
6. Run `pnpm check:release` before handoff.
7. Delete obsolete snapshots, reports, and temporary artifacts.

## Review checklist

- Every retained test maps to a distinct user-visible or repository-specific failure.
- No assertion duplicates a stronger assertion elsewhere.
- Locators express intent and failure messages contain route or component context where useful.
- Desktop-only and mobile-only coverage is scoped deliberately.
- The suite remains deterministic, parallel-safe, and free of network dependencies.
