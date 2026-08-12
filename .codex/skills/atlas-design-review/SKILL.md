---
name: atlas-design-review
description: Review or implement visual, layout, motion, responsive, and design-system changes in the Atlas Astro portfolio. Use for homepage, project cards, case-study visuals, writing pages, theme consistency, mobile and desktop behavior, visual QA, or UI refactors in this repository.
---

# Atlas Design Review

Keep Atlas deliberate, technical, and quiet. Preserve its code-native visual language while making every layout readable on desktop and as a complete scaled thumbnail on mobile.

## Inspect before editing

1. Read the affected page, component, shared visual primitives, global tokens, and nearby tests.
2. State the visual's meaning and the intended desktop, tablet, and mobile behavior.
3. Reuse an existing primitive or token before adding a new abstraction.

## Preserve the visual system

- Use lime for active state, execution order, and data flow. Use neutrals for structure and boundaries. Do not assign colors without semantic meaning.
- Model architecture accurately before decorating it. Arrows must have a real source and target.
- Prefer semantic HTML and CSS visuals. Do not replace UI diagrams with raster images or generated artwork unless the user explicitly requests it.
- Reuse `VisualFrame`, `VisualHeader`, `FlowArrow`, and project visual configuration where they fit. Extract a primitive only after at least two real consumers share the same behavior.
- Avoid nested card noise, arbitrary gradients, filler metadata, decorative logos, and generic AI-dashboard styling.
- Keep spacing, radii, borders, type scale, and light/dark contrast token-driven.
- Keep inline styles out of templates; Atlas uses a strict content security policy.

## Responsive and motion contract

- Desktop may show a full-size visual. At `640px` and below, keep the entire visual and scale it inside a fixed overview frame; do not crop, selectively hide, or redesign its information.
- Keep content order semantic in the markup. Use CSS only for presentation changes.
- Define responsive behavior in CSS, not duplicated viewport JavaScript.
- Motion must clarify flow or layering, remain smooth, and respect `prefers-reduced-motion`. Static mode must remain complete.
- Sticky project stacks must keep their section heading visible while active and release both heading and cards at the same boundary.

## Implement the smallest coherent change

1. Fix the shared cause when multiple pages exhibit the same issue.
2. Delete superseded selectors, variants, data fields, and fallback logic in the same change.
3. Avoid one-off breakpoints and magic offsets. Name a shared custom property when a value represents a layout contract.
4. Keep Astro components presentational and static. Add client JavaScript only for behavior CSS and native elements cannot provide.

## Verify visually and structurally

1. Run the focused build or test first.
2. Inspect at `1440x900`, `768x900` when the intermediate layout changes, and both `375x812` and `402x874` for mobile or sticky changes.
3. Check light and dark themes, reduced motion, text wrapping, overflow, clipping, focus states, and touch targets.
4. Use screenshots to judge composition and numeric bounds to diagnose geometry. Neither replaces the other.
5. Use `$atlas-test-review` when coverage must change.
6. Run `pnpm check:release` before handoff and remove temporary screenshots or reports.

## Sign-off criteria

- The visual grammar is consistent across homepage, project index, and case study.
- No text or border clips at supported viewports.
- Mobile shows a legible complete thumbnail, not a partial desktop canvas.
- Accessibility, reduced motion, CSP, and static rendering still work.
- No stale CSS, duplicate breakpoint logic, or test-only production code remains.
