# ADR-007: Resolve Expo modules through the SDK compatibility map

## Status

Superseded by ADR-009.

## Context

RepairFlow uses Expo SDK 56 with React Native 0.85.1. Installing a separately guessed Expo Router version pulled React Native 0.86 packages whose transitive packages were not yet available from the registry.

## Decision

The mobile client pins Expo, React and React Native directly. Expo Router and Expo-managed native modules are installed only through `expo install`, which selects versions from the SDK compatibility map. The lockfile is checked to reject React Native 0.86.2 packages in the SDK 56 lane.

## Consequences

- Mobile dependency resolution is repeatable and fails before a broken lockfile is committed.
- RepairFlow does not automatically adopt newly published React Native minor lines.
- Runtime upgrades require a dedicated issue, compatibility check and ADR update.
