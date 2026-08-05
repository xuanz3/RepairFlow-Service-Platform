#!/bin/bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

docker compose -f infra/docker-compose.yml up -d postgres azurite
printf '
Local services are ready. Start the API with:
'
printf '  dotnet run --project apps/api/src/RepairFlow.Api

'
printf 'Start the clients with:
'
printf '  pnpm --filter @repairflow/desktop dev
'
printf '  pnpm --filter @repairflow/mobile start
'
