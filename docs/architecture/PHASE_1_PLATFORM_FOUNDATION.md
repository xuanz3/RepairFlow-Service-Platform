# Phase 1 Platform Foundation

## Objective

Establish one versioned workspace containing the mobile client, desktop client, service, shared contracts and local infrastructure. Phase 1 is complete only when all components build from a clean checkout and the service readiness endpoint verifies PostgreSQL connectivity.

## Boundaries

- The service remains a modular monolith.
- Mobile and desktop share contracts, validation and design tokens, not complete interface components.
- SignalR, SQLite outbox operations and attachment recovery remain Phase 3 responsibilities.
- The Phase 1 clients are navigable application shells with generated data; full repair operations begin in Phase 2.

## Service modules

```text
RepairFlow.Domain
  repair state machine and entities
RepairFlow.Application
  query and command boundaries
RepairFlow.Infrastructure
  PostgreSQL, Identity and repositories
RepairFlow.Api
  HTTP, authentication, health and OpenAPI
```

## Reliability decisions

- PostgreSQL readiness is checked separately from process liveness.
- Example data is created only in the local service database.
- Client contracts use explicit status values and optimistic version fields.
- Electron keeps Node integration disabled and exposes only a minimal preload boundary.
- Mobile secure storage and SQLite packages are installed before feature work starts.
