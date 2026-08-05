# System Overview

```mermaid
flowchart LR
    Mobile[React Native mobile client\nSQLite + outbox] -->|HTTPS and SignalR| API[ASP.NET Core modular service]
    Desktop[Electron desktop client\nSQLite + outbox] -->|HTTPS and SignalR| API
    API --> DB[(PostgreSQL)]
    API --> Files[Local S3-compatible evidence storage]
    API --> Telemetry[OpenTelemetry Collector]
    Telemetry --> Metrics[Prometheus and Grafana]
```

## Boundaries

- Clients write locally before attempting network operations.
- The service owns authorisation, state transitions and idempotency.
- Evidence bytes are stored separately from evidence metadata.
- The service remains a modular monolith for v1.
- Background workers are introduced only when measured workloads justify them.
