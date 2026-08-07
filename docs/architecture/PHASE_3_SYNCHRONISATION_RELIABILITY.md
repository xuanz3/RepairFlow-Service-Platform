# Phase 3 Synchronisation Reliability

RepairFlow keeps local workflow commits durable and treats network synchronisation as a replayable transport concern. The protocol follows the repository synchronisation principles: stable operation identifiers, idempotent server replay, explicit versions, deletion tombstones, visible conflicts and restart-safe queues.

## Write path

1. A client commits the user change to its local workflow store.
2. A stable operation envelope is committed to the local outbox in the same user flow.
3. The sync engine sends ready operations with bounded exponential retry.
4. The service records the operation identifier and SHA-256 request hash before executing the mutation.
5. Repeating the same operation returns the stored result; reusing an identifier with a different request is rejected.
6. Version conflicts become durable conflict records rather than silent last-write-wins updates.

## Read path

Clients request a cursor-based delta page. The first pull is a current snapshot. Later pulls return ordered change-journal records. Tombstones remove local aggregates while stale versions are ignored.

## Attachments

Evidence bytes use a resumable session with an exact committed byte offset. Chunks are capped at 1 MiB, total evidence is capped at 50 MiB, file names cannot contain paths and completion requires a fixed-time SHA-256 match. Active bytes are stored under server-generated session names, never user-controlled paths.

## Operations

OpenTelemetry traces and metrics cover HTTP traffic, sync operation outcomes, delta sizes, upload bytes and integrity failures. A local opt-in observability profile provides OpenTelemetry Collector, Prometheus and a provisioned Grafana dashboard.

## Failure model

Process termination cannot discard committed outbox work. Network/service errors retry with bounded backoff. Conflicts stop automatic replay. Interrupted uploads resume only at the committed offset. Controlled failure tests cover restart, service unavailability, duplicate replay and conflicts.
