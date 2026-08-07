# Phase 2 Local Workflows

## Desktop

```bash
pnpm --filter @repairflow/desktop dev
```

The desktop SQLite database and evidence directory are created under Electron's application `userData` path. Use **Reset preview** to replace generated local records.

## Mobile

```bash
pnpm --filter @repairflow/mobile start
```

Open the project in a compatible Expo development environment. Camera functions require a physical device or simulator configuration that provides a camera feed. Manual serial entry remains available when camera access is unavailable.

## Service

```bash
./tools/dev/start-local.command
dotnet run --project apps/api/src/RepairFlow.Api
```

Workflow endpoints require an authenticated user with the appropriate Intake, Technician, Quality or Admin role.

## Data handling

Only generated demonstration records may be used during development. Do not import customer files, unlock codes, identity documents or production credentials.

## Optional installed-device flow

After a RepairFlow development build is installed on a simulator or device and the Maestro CLI is available:

```bash
./tools/verify/mobile-maestro.command
```
