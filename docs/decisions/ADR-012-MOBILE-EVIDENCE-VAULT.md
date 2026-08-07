# ADR-012: Mobile evidence is preserved before workflow commit

## Status

Accepted.

## Context

Expo Camera returns files in temporary storage. A repair evidence record must not point at a cache file that the operating system may remove.

## Decision

After capture, RepairFlow copies the file into an application document directory scoped to the repair case. The app reads the copied bytes, calculates SHA-256 with `expo-crypto`, and then stores the evidence metadata in SQLite.

## Consequences

- evidence survives camera cache cleanup;
- file integrity can be checked before future upload;
- interrupted and resumable uploads remain Phase 3 work;
- real customer evidence remains prohibited from the public repository and automated test fixtures.
