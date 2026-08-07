# Phase 3 Reliability Operations

## Local observability

The default local stack remains PostgreSQL and Azurite. Observability is opt-in so normal development does not download or run extra services.

```bash
docker compose -f infra/docker-compose.yml --profile observability up -d
```

Set `OpenTelemetry__OtlpEndpoint=http://127.0.0.1:4317` before starting the API. Prometheus is available on port 9090 and Grafana on port 3300. The provisioned dashboard is `RepairFlow Synchronisation Reliability`.

## Recovery rules

- Pending and retrying operations stay in SQLite until an acknowledged terminal state.
- An operation left in `sending` after process termination is recovered to `retrying` with the same operation identifier.
- Conflicts require an explicit user or operator decision.
- Upload clients query the current session offset before resuming.
- SHA-256 mismatch blocks completion; it does not silently replace the declared digest.

## Verification

```bash
pnpm verify:phase3
pnpm test:failure
pnpm measure:sync
dotnet test apps/api/RepairFlow.sln --configuration Release
```

Generated metrics are test evidence only and are not committed to the repository.
