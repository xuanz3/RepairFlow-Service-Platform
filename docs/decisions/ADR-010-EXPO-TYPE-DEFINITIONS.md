# ADR-010: Align React type definitions with Expo SDK validation

## Status
Accepted.

## Context
The isolated Expo SDK 55 dependency graph resolved successfully, but the Expo compatibility check rejected `@types/react` 19.2.2 and required the current SDK 55-compatible patch line `~19.2.10`. Runtime packages were already valid; the mismatch was limited to TypeScript declarations.

## Decision
RepairFlow pins `@types/react` to `~19.2.10` in the mobile workspace. The Expo compatibility check remains a blocking verification step and no package is excluded from that check.

## Consequences
- TypeScript declarations match the Expo SDK 55 compatibility metadata used during verification.
- React remains on 19.2.0 and React Native remains on 0.83.10.
- The runtime dependency lane is unchanged.
- Future type-definition changes must pass the isolated dependency preflight, repository validator and Expo compatibility check.
