# RepairFlow

RepairFlow is an offline-first repair operations platform for electronics service teams. It connects mobile device intake and workshop evidence capture with a desktop repair workspace and a central service API.

> Current stage: **Phase 1 - Platform Foundation and Service Core**

## Core workflow

`Check-in → condition evidence → diagnosis → repair work → quality verification → delivery`

<!-- product-media:start -->

Product media will be inserted here by the validated capture pipeline in Phase 4.

<!-- product-media:end -->

## Platform

| Component            | Responsibility                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Mobile               | Device check-in, QR lookup, condition evidence, diagnosis steps and offline queue visibility      |
| Desktop              | Workshop queue, repair case inspection, evidence comparison, quality verification and diagnostics |
| Service              | Identity, roles, repair workflow rules, PostgreSQL persistence, audit records and OpenAPI         |
| Local infrastructure | PostgreSQL and Azurite through Docker Compose                                                     |

## Technology

- React Native + Expo for iOS and Android
- Electron + React + TypeScript for Windows, macOS and Linux
- ASP.NET Core and C# for the service layer
- PostgreSQL for central data and SQLite for client-side offline storage
- pnpm workspaces and Turborepo for the shared TypeScript workspace
- GitHub Actions for validation, builds and release checks

## Repository structure

```text
apps/
  api/       ASP.NET Core modular service
  desktop/   Electron workshop client
  mobile/    React Native intake client
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

| Stage   | Purpose                                                          | Status   |
| ------- | ---------------------------------------------------------------- | -------- |
| Phase 0 | Product definition, design direction and repository governance   | Complete |
| Phase 1 | Platform foundation, backend, identity and shared contracts      | Complete |
| Phase 2 | Desktop and mobile repair workflows                              | Planned  |
| Phase 3 | Offline synchronisation, reliability, security and observability | Planned  |
| Phase 4 | Packaging, automated product media and the v1.0 release          | Planned  |

## Licence

MIT Licence. See `LICENSE`.
