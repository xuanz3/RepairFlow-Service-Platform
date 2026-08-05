# ADR-004: Use one versioned workspace

## Status

Accepted

## Decision

Use pnpm workspaces and Turborepo for the TypeScript clients and shared packages, while keeping the .NET solution under `apps/api`.

## Rationale

- Shared contracts and validation change with both clients.
- One pull request can verify compatible API and client boundaries.
- A single lockfile reduces version drift.
- The .NET solution remains independently buildable with standard tooling.

## Consequences

- Client packages must not import application internals from another client.
- Shared packages require explicit public exports.
- CI must verify Windows, macOS and Linux shell builds.
