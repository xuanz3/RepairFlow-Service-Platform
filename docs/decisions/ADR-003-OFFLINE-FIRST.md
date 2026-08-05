# ADR-003: Local-first writes with durable outbox

## Context

Repair work may happen on unstable workshop networks. Network-first forms risk losing evidence and duplicate submissions after retries.

## Decision

Commit user work to SQLite and a durable outbox before synchronisation.

## Consequences

Clients require schema migration, recovery and conflict interfaces. The service must provide idempotent mutations and incremental pull contracts.
