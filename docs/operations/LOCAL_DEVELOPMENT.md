# Local Development

## First verification

```bash
./tools/dev/doctor.sh
pnpm install --frozen-lockfile
dotnet restore apps/api/RepairFlow.sln --locked-mode
pnpm verify
dotnet build apps/api/RepairFlow.sln --configuration Release --no-restore
dotnet test apps/api/RepairFlow.sln --configuration Release --no-build
```

## Start services

```bash
./tools/dev/start-local.command
dotnet run --project apps/api/src/RepairFlow.Api
```

Service endpoints:

- `GET http://127.0.0.1:5098/health/live`
- `GET http://127.0.0.1:5098/health/ready`
- `http://127.0.0.1:5098/swagger` in Development

## Start clients

```bash
pnpm --filter @repairflow/desktop dev
pnpm --filter @repairflow/mobile start
```

The local PostgreSQL password is intentionally limited to Docker development. It must not be used for any remote database.
