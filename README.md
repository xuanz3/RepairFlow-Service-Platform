# RepairFlow

RepairFlow is an offline-first repair operations platform for electronics service teams. It connects mobile device intake and evidence capture with a desktop workshop workspace and an ASP.NET Core service.

> Current stage: **Phase 4 - Packaging, Product Media and v1.0**

## Core workflow

`Check-in → condition evidence → diagnosis → repair work → quality verification → delivery`

<!-- product-media:start -->

Product media will be inserted by the validated capture pipeline in Phase 4.

<!-- product-media:end -->

## Operational capabilities

- Desktop workshop queue with search, filters and case-level workspaces
- Electron SQLite workflow store behind a context-isolated IPC boundary
- Mobile SQLite queue with validated device check-in
- Expo Camera QR scanning and persistent evidence capture
- Diagnosis, repair actions, evidence and quality review on both clients
- ASP.NET Core workflow endpoints with role policies and version checks
- Playwright desktop end-to-end validation and Maestro mobile flow contracts
- Durable desktop/mobile outboxes with idempotent service replay and delta pull
- Resumable SHA-256 verified evidence uploads with explicit recovery states
- OpenTelemetry metrics/traces with an opt-in local Prometheus/Grafana profile

## Platform

| Component            | Responsibility                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Mobile               | Device check-in, QR lookup, condition evidence, diagnosis, repair actions and local queue  |
| Desktop              | Workshop queue, case inspection, repair action tracking, evidence and quality verification |
| Service              | Identity, roles, workflow rules, PostgreSQL persistence, audit records and OpenAPI         |
| Local infrastructure | PostgreSQL and Azurite through Docker Compose                                              |

## Technology

- React Native + Expo for iOS and Android
- Electron + React + TypeScript for Windows, macOS and Linux
- ASP.NET Core and C# for the service layer
- PostgreSQL for central data
- SQLite for Electron and mobile local workflow stores
- Expo Camera, FileSystem, Crypto and SecureStore for mobile capture boundaries
- pnpm workspaces and Turborepo for the shared TypeScript workspace
- xUnit, Vitest, Playwright and Maestro for workflow validation
- OpenTelemetry, Prometheus and Grafana for reliability telemetry
- GitHub Actions for validation, cross-platform builds and release checks

## Repository structure

```text
apps/
  api/       ASP.NET Core workflow service
  desktop/   Electron workshop client
  mobile/    React Native intake and repair client
packages/
  api-client/
  contracts/
  design-tokens/
  validation/
infra/
  docker-compose.yml
tools/
  dev/
  verify/
```

## Local verification

Requirements:

- Node.js 22.13 or newer
- pnpm 11.9
- .NET SDK 10
- Docker Desktop

```bash
pnpm install --frozen-lockfile
dotnet restore apps/api/RepairFlow.sln --locked-mode
pnpm verify
pnpm --filter @repairflow/desktop exec playwright install chromium
pnpm e2e:desktop
dotnet build apps/api/RepairFlow.sln --configuration Release --no-restore
dotnet test apps/api/RepairFlow.sln --configuration Release --no-build
./tools/verify/service-smoke.sh
```

## Local operation

```bash
./tools/dev/start-local.command
dotnet run --project apps/api/src/RepairFlow.Api
pnpm --filter @repairflow/desktop dev
pnpm --filter @repairflow/mobile start
```

All example customers, devices, serial numbers and attachments are fictional or generated. The repository must not contain customer files, device unlock credentials or long-lived secrets.

## Delivery stages

| Stage   | Purpose                                                          | Status      |
| ------- | ---------------------------------------------------------------- | ----------- |
| Phase 0 | Product definition, design direction and repository governance   | Complete    |
| Phase 1 | Platform foundation, backend, identity and shared contracts      | Complete    |
| Phase 2 | Desktop and mobile repair workflows                              | Complete    |
| Phase 3 | Offline synchronisation, reliability, security and observability | Complete    |
| Phase 4 | Packaging, automated product media and the v1.0 release          | In progress |

## Licence

MIT
