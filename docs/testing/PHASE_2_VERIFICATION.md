# Phase 2 Verification

## Static gates

- repository and Phase 1 contracts;
- Phase 2 required-file and version contracts;
- Expo SDK 55 dependency lane;
- Electron isolation, IPC and SQLite rules;
- ASP.NET Core workflow endpoint rules;
- Maestro flow structure.

## Automated tests

- shared TypeScript contract and validation tests;
- desktop workflow-model tests;
- desktop Playwright intake and diagnosis flow;
- mobile workflow-model tests;
- .NET domain workflow tests;
- .NET service and persistence smoke tests;
- desktop build on Linux, macOS and Windows;
- Docker Compose configuration validation.

## Local release gate

```bash
pnpm install --frozen-lockfile
pnpm --dir apps/mobile exec expo install --check
pnpm verify
pnpm --filter @repairflow/desktop exec playwright install chromium
pnpm e2e:desktop
dotnet restore apps/api/RepairFlow.sln --locked-mode
dotnet build apps/api/RepairFlow.sln --configuration Release --no-restore
dotnet test apps/api/RepairFlow.sln --configuration Release --no-build
./tools/verify/service-smoke.sh
```

No Phase 2 release is published until the exact pull request head and merged `main` commit have passed the required GitHub Actions workflows.
