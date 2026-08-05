#!/bin/bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_FILE="${TMPDIR:-/tmp}/repairflow-api-smoke.log"
API_PID=""

cleanup() {
  if [ -n "$API_PID" ] && kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1 || true
    wait "$API_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

cd "$ROOT"
docker compose -f infra/docker-compose.yml up -d postgres azurite

for attempt in $(seq 1 30); do
  if docker compose -f infra/docker-compose.yml exec -T postgres pg_isready -U repairflow -d repairflow >/dev/null 2>&1; then
    break
  fi
  [ "$attempt" -lt 30 ] || { echo "PostgreSQL did not become ready." >&2; exit 1; }
  sleep 2
done

ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5098 dotnet run --no-build --configuration Release --project apps/api/src/RepairFlow.Api >"$LOG_FILE" 2>&1 &
API_PID=$!

for attempt in $(seq 1 40); do
  if curl --fail --silent http://127.0.0.1:5098/health/ready >/dev/null; then
    echo "RepairFlow service smoke test passed."
    exit 0
  fi
  if ! kill -0 "$API_PID" >/dev/null 2>&1; then
    cat "$LOG_FILE" >&2
    exit 1
  fi
  sleep 2
done

cat "$LOG_FILE" >&2
echo "RepairFlow service did not become ready." >&2
exit 1
