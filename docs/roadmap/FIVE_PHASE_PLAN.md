# Five-Phase Delivery Plan

## Phase 0 - Product and Governance

Product scope, workflows, design direction, architecture, issue backlog, branch rules and the first pre-release.

Expected focused commits: 7-10  
Release: `v0.0.1`

## Phase 1 - Platform Foundation and Service Core

Monorepo, application shells, shared contracts, PostgreSQL domain, identity, RBAC, audit, OpenAPI, local services and baseline CI.

Expected focused commits: 18-25  
Releases: `v0.1.0-foundation`, `v0.2.0-service-core`

## Phase 2 - Desktop and Mobile Repair Workflows

Desktop workshop workspace, mobile check-in, QR, evidence capture, diagnosis, repair actions, quality review, local stores and end-to-end flows.

Expected focused commits: 25-35  
Releases: `v0.3.0-desktop-preview`, `v0.4.0-mobile-preview`

## Phase 3 - Synchronisation Reliability and Operations

Durable outbox, idempotency, delta pull, tombstones, conflicts, interrupted uploads, security checks, performance measurement, telemetry and controlled failure recovery.

Expected focused commits: 20-30  
Releases: `v0.5.0-offline-workflows`, `v0.6.0-reliability`

## Phase 4 - Packaging Product Media and v1.0

Cross-platform packages, checksums, SBOM, deterministic captures, README media insertion, installation and accessibility checks, release candidates and v1.0.0.

Expected focused commits: 14-22  
Releases: `v0.9.0-rc.1`, later release candidates when needed, `v1.0.0`

## Commit rule

Commit count is an expected range, not a quota. Each commit must represent a reviewable change such as one vertical capability, one test group, one reliability correction, one decision record or one release-engineering improvement. Cosmetic splitting and timestamp-only commits are prohibited.
