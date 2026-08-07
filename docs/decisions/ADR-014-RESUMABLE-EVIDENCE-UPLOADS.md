# ADR-014: Resumable evidence uploads with content integrity

## Status

Accepted.

## Decision

Large evidence uses an upload session with an exact server-committed byte offset. The client may resume only from that offset. Chunk bodies are limited to 1 MiB and the completed byte stream must match the declared SHA-256 digest before the session is completed.

## Security boundaries

User file names are metadata only and may not contain paths. Disk names are generated from the upload session identifier. Content type and total size are allowlisted and bounded. Hash comparison uses fixed-time comparison.

## Consequences

Interrupted transfers do not require restarting from byte zero and partial bytes cannot be promoted without integrity verification. Server-side retention and remote object-storage offload are deferred beyond v1.
