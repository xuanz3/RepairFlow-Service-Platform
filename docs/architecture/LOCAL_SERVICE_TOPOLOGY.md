# Local Service Topology

```mermaid
flowchart LR
  Mobile[React Native mobile] -->|HTTPS| Api[ASP.NET Core API]
  Desktop[Electron desktop] -->|HTTPS| Api
  Api --> Postgres[(PostgreSQL 17)]
  Api --> Azurite[(Azurite blob service)]
  Mobile --> MobileDb[(SQLite - Phase 2/3)]
  Desktop --> DesktopDb[(SQLite - Phase 2/3)]
```

Ports are intentionally non-default where practical:

| Service       | Local port |
| ------------- | ---------: |
| API           |       5098 |
| PostgreSQL    |      55440 |
| Azurite Blob  |      10000 |
| Azurite Queue |      10001 |
| Azurite Table |      10002 |
