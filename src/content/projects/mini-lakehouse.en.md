---
title: Mini Lakehouse
description: A fully deployed personal lakehouse spanning cloud infrastructure, catalog contracts, orchestration, analytics and GPU document processing.
outcome: A fully deployed personal lakehouse with independently owned infrastructure, data and delivery boundaries.
lang: en
translationKey: mini-lakehouse
slug: mini-lakehouse
role: Sole designer and engineer
period: Jul 2026 — Present
status: maintained
statusLabel: Deployed & maintained
featured: true
order: 1
topics:
  - data-platforms
  - lakehouse
  - cloud-infrastructure
  - reliability
stack:
  - Apache Iceberg
  - AWS
  - Airflow
  - dbt
  - Terraform
  - OCI
links:
  repository: https://github.com/ToGiaBaoKDL/mini-lakehouse
---

## Context

Mini Lakehouse is my personal, fully deployed data platform. I built it to explore a practical question: how can a small platform preserve production-grade ownership and delivery boundaries without inheriting the cost and operational weight of a large organization?

The system runs its AWS data plane separately from a private Oracle Cloud services host. Airflow coordinates Spark, dbt and document-processing workloads; S3 and Apache Iceberg provide the storage layer; Glue supplies the catalog; Athena and small data applications serve the resulting datasets.

## Constraints

- Keep cloud cost intentional and make expensive compute ephemeral.
- Expose no public ingress to the services host.
- Avoid long-lived cloud credentials in CI and runtime workloads.
- Make data jobs safe to replay.
- Let each deployable boundary release and roll back independently.
- Keep local development understandable despite multiple execution environments.

## Architecture and ownership

The platform is divided by responsibility rather than by technology logo.

| Boundary                   | Responsibility                                                |
| -------------------------- | ------------------------------------------------------------- |
| Terraform                  | AWS, OCI, Tailscale, GitHub and Cloudflare infrastructure     |
| YAML contracts + PyIceberg | Glue databases, Iceberg tables and drift validation           |
| Spark jobs                 | Source extraction, landing publication and curated transforms |
| OCR workers                | Remote GPU execution and curated document outputs             |
| dbt domains                | Analytics tables, tests and release ownership                 |
| Airflow                    | Coordination only; business logic stays in owned runtimes     |

This separation prevents the orchestrator from becoming the application and keeps infrastructure state from becoming the catalog source of truth.

## Decision: catalog contracts instead of Terraform tables

Terraform creates infrastructure and the containers required by the catalog, but it does not create Glue databases or Iceberg tables. Those objects are declared as versioned YAML contracts and reconciled through a PyIceberg control plane.

The trade-off is another small control-plane component. The benefit is a cleaner ownership boundary: table evolution, storage layout and compatibility checks live beside the data contract instead of inside infrastructure state.

## Data and workload paths

Spark publishes deterministic landing partitions and curated tables. Replaying an authoritative period replaces that landing partition before current mutations are merged into curated data.

The document path is deliberately separate. Airflow starts a pinned worker that submits a remote GPU run, streams logs, validates artifacts, writes curated outputs and commits the Iceberg run record last. Provider SDKs and OCR libraries never enter the Airflow runtime.

dbt projects consume only their domain-owned curated inputs. Each domain has its own runtime identity, models, tests, image and release lifecycle.

## Delivery and rollback

Pull requests validate affected components. A reviewed merge publishes immutable images or EMR artifacts under the Git commit SHA. GitHub exchanges OIDC tokens for short-lived credentials, so CI stores no AWS access key, Tailscale OAuth secret or SSH private key.

An EMR release is complete only after its entrypoints, locked dependencies, contract bundle and checksum manifest have been uploaded. CI then updates a single SSM pointer atomically. A partial upload is repairable; a completed revision is immutable and reusable.

Component rollbacks verify that the target digest belongs to a reviewed revision. Airflow, dbt domains, the Inspector and OCR can move independently instead of being coupled to one platform release.

## Security and operations

The services host has no public ingress. Tailscale provides operator access, while Cloudflare Access and Tunnel protect browser-facing services. Runtime secrets are materialized only for the service that consumes them.

Maintenance workflows compact recent Iceberg partitions, expire snapshots and remove sufficiently old orphan files. Catalog validation reports stale platform-owned objects but never deletes them automatically.

## Current outcome

The complete topology is deployed and maintained as a personal platform. It currently supports GitHub activity analytics, arXiv research data, document OCR and read-only inspection workflows.

Cost and workload metrics will be added only after I have captured them through a repeatable measurement process.

## What I would change

The platform deliberately optimizes for explicit boundaries. That produces more deployment surfaces and more documentation than a single-machine stack. If the workload remained small and short-lived, I would collapse some runtime boundaries. If it grew, I would keep the ownership model but strengthen service-level telemetry and publish a repeatable cost/performance benchmark.
