# RepairFlow

RepairFlow is an offline-first repair operations platform for electronics service teams. It connects mobile intake and workshop evidence capture with a desktop repair workspace and a central service API.

> Current stage: **Phase 0 - Product and Governance**

## Core workflow

`Check-in → condition evidence → diagnosis → repair work → quality verification → delivery`

## Planned platform

- React Native + Expo mobile application for iOS and Android
- Electron + React + TypeScript desktop application for Windows, macOS and Linux
- ASP.NET Core service with PostgreSQL, Identity, RBAC, SignalR and OpenAPI
- SQLite local stores with outbox synchronisation, idempotency and explicit conflict resolution
- Camera, QR scanning, image annotation, attachment integrity verification and resumable uploads
- Automated testing, security checks, observability and reproducible releases

<!-- product-media:start -->
Product media will be inserted here by the validated capture pipeline in Phase 4.
<!-- product-media:end -->

## Delivery stages

| Stage | Purpose |
|---|---|
| Phase 0 | Product definition, design direction and repository governance |
| Phase 1 | Platform foundation, backend, identity and shared contracts |
| Phase 2 | Desktop and mobile repair workflows |
| Phase 3 | Offline synchronisation, reliability, security and observability |
| Phase 4 | Packaging, automated product media and the v1.0 release |

## Data boundary

All sample customers, devices, serial numbers, photographs and attachments are fictional or generated. The repository must not contain real customer files, device unlock credentials or long-lived secrets.

## Licence

MIT Licence. See `LICENSE`.
