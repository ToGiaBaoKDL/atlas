---
title: VN Market Pulse
description: A bounded Vietnamese web-research pipeline built around typed model outputs, explicit deadlines and source-backed generation.
outcome: A research workflow that gives models semantic responsibility while deterministic code enforces runtime and validation limits.
lang: en
translationKey: vn-market-pulse
slug: vn-market-pulse
role: Sole designer and engineer
period: Jul 2026
status: completed
statusLabel: Completed
featured: false
order: 2
topics:
  - applied-ai
  - reliability
stack:
  - Python
  - PydanticAI
  - Streamlit
links:
  repository: https://github.com/ToGiaBaoKDL/vn-market-pulse
---

## Context

VN Market Pulse researches a Vietnamese topic and produces one source-backed Facebook post. The goal was not to build another collection of ranking heuristics, but to define a narrow contract between semantic model decisions and deterministic application controls.

## Pipeline

The application plans focused searches, gathers a bounded metadata pool, lets the configured model select extraction targets, reads provider-extracted content and writes one validated post with the exact source identifiers it used.

PydanticAI owns typed output, validation, bounded self-correction and usage accounting. Application code owns deadlines, retrieval budgets, finite transport retries, URL canonicalization and sanitized diagnostics.

## Design decision

The system does not add local BM25, MMR or fusion heuristics. The model receives the complete bounded candidate pool and owns semantic selection. Deterministic code does what it can prove: reject invalid dates, normalize URLs, enforce budgets and validate references.

This keeps responsibility explicit. It also means quality depends on the configured model and provider data, so the project makes no unsupported accuracy or hallucination-reduction claim.

## Outcome

The completed project includes CLI and Streamlit interfaces, typed outputs, provider-aware budgets, deadline propagation, validation and automated tests around its application contracts.
