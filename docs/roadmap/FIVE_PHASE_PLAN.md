# Five-Phase Delivery Plan

Status: **Complete**

## Phase 0 - Product and Governance

Defined product scope, repair workflows, design direction, architecture boundaries, repository governance and the delivery plan.

Release: `v0.0.1`

## Phase 1 - Platform Foundation and Service Core

Established the monorepo, application shells, shared contracts, PostgreSQL domain, identity, role policies, audit boundaries, OpenAPI, local services and baseline CI.

Releases: `v0.1.0-foundation`, `v0.2.0-service-core`

## Phase 2 - Desktop and Mobile Repair Workflows

Delivered the desktop workshop workspace, mobile check-in, QR handling, evidence capture, diagnosis, repair actions, quality review, local stores and end-to-end workflow verification.

Releases: `v0.3.0-desktop-preview`, `v0.4.0-mobile-preview`

## Phase 3 - Synchronisation Reliability and Operations

Added the durable outbox, idempotent replay, delta pull, tombstones, explicit conflicts, interrupted-upload recovery, security checks, performance measurement, telemetry and controlled failure recovery.

Releases: `v0.5.0-offline-workflows`, `v0.6.0-reliability`

## Phase 4 - Packaging and v1.0

Completed cross-platform packaging, checksums, SBOM generation, installation boundaries, accessibility checks, release-candidate verification and the v1.0.0 release. Product screenshots are maintained separately from blocking release checks.

Releases: `v0.9.0-rc.1`, `v1.0.0`

## Delivery principle

Each phase was integrated through reviewable changes tied to a concrete capability, verification group, reliability correction, architectural decision or release-engineering improvement.
