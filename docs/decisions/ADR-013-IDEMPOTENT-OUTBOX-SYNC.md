# ADR-013: Durable outbox and server idempotency journal

## Status

Accepted.

## Decision

Every outbound mutation receives a client-generated stable operation identifier and is durably recorded before transmission. The service persists an operation journal keyed by that identifier and hashes the canonical request. Matching retries replay the previous result; a different payload with the same identifier is rejected.

## Consequences

Clients can recover after process or network interruption without guessing whether a mutation committed. The operation journal adds storage and requires retention policy work after v1. Conflicts remain explicit and are never converted to last-write-wins updates.
