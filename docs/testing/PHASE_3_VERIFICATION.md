# Phase 3 Verification

Phase 3 uses deterministic automated gates rather than screenshots.

- Sync engine unit tests cover retry backoff, conflict persistence, delta application, tombstones and upload chunk planning.
- API/xUnit tests cover authentication, idempotent replay, stale-version conflicts, delta journal behaviour and upload invariants.
- Desktop and mobile tests cover durable queue state and restart recovery.
- `phase3-failure-scenarios.mjs` simulates network failure, process restart, token expiry, replay and conflicts over a disk-backed outbox.
- `measure-sync-engine.mjs` measures 1,000-operation outbox processing and 1,000-change delta application against a deliberately generous local CI budget.
- Security validation checks path handling, size limits, fixed-time digest comparison, role policies, Electron isolation and token-storage boundaries.
- GitHub Actions repeats the workspace, service, recovery, performance, cross-platform desktop and observability configuration gates.

No final product media is produced in Phase 3; the controlled 18-image capture contract remains reserved for Phase 4.
