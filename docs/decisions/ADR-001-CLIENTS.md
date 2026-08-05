# ADR-001: Separate mobile and desktop clients

## Context

Repair intake and workshop management require different input methods, device capabilities and information density.

## Decision

Use React Native + Expo for mobile capture and Electron + React + TypeScript for the desktop workshop.

## Consequences

Shared contracts and tokens are reused, but layouts and interactions remain platform-appropriate. Cross-platform behaviour requires a deliberate test matrix.
