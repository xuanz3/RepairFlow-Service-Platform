# ADR-009: Pin the mobile client to the official Expo SDK 55 template lane

## Status

Accepted. Supersedes the SDK 56 package selections in ADR-006 and ADR-007.

## Context

During Phase 1, Expo SDK 56 package resolution selected Expo Router patches that referenced React Native 0.86.2 packages before all matching packages were available from the public npm registry. Re-running the dynamic compatibility resolver therefore produced a non-reproducible dependency graph.

## Decision

RepairFlow uses the dependency versions from Expo's official `sdk-55` default template as the mobile baseline: Expo 55.0.28, Expo Router 55.0.17, React Native 0.83.10 and React 19.2.0. SQLite and SecureStore are pinned to their SDK 55 documented versions. The repository manifest is authoritative; Phase 1 does not ask Expo CLI to rewrite package versions.

## Consequences

- Mobile dependency installation is deterministic and does not depend on a moving compatibility response.
- Expo Router remains part of the architecture.
- The project can upgrade to SDK 56 or later only through a dedicated dependency change with emulator, native build and regression evidence.
- ADR-006 and ADR-007 remain as a record of the rejected runtime lane.
