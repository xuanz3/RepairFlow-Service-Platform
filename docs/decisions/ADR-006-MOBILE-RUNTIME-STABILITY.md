# ADR-006: Mobile runtime stability baseline

## Status

Superseded by ADR-009.
Accepted for Phase 1.

## Decision

RepairFlow mobile uses Expo SDK 56 with React Native 0.85 and React 19.2.3 for the Phase 1 foundation. Expo-managed packages are resolved with `expo install`, and the resulting versions are committed to the workspace lockfile.

## Context

The initial Phase 1 run selected Expo SDK 57 immediately after its release. Its React Native 0.86 dependency graph referenced a package version that had not yet propagated to the public registry, so installation stopped before a lockfile was committed.

## Rationale

- Expo SDK 56 remains supported and targets React Native 0.85.
- The selected package line has been available long enough to avoid release-day registry propagation risk.
- The application architecture and planned functionality are unchanged.
- Future upgrades remain explicit, tested changes rather than implicit dependency drift.

## Consequences

- Phase 1 uses exact primary runtime versions and a committed lockfile.
- Expo packages are checked with `expo install --check` in local and CI gates.
- Moving to Expo SDK 57 or later requires a dedicated dependency upgrade issue and mobile build verification.
