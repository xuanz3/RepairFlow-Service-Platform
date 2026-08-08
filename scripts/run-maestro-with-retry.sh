#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: run-maestro-with-retry.sh test [Maestro options] FLOW" >&2
  exit 64
fi

repairflow_maestro_bin="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
repairflow_max_attempts="${MAESTRO_MAX_ATTEMPTS:-2}"

test -x "$repairflow_maestro_bin"
case "$repairflow_max_attempts" in
  ''|*[!0-9]*|0) echo "MAESTRO_MAX_ATTEMPTS must be a positive integer." >&2; exit 64 ;;
esac

export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"
export MAESTRO_CLI_NO_ANALYTICS="${MAESTRO_CLI_NO_ANALYTICS:-1}"

repairflow_attempt=1
while [ "$repairflow_attempt" -le "$repairflow_max_attempts" ]; do
  echo "Maestro attempt ${repairflow_attempt}/${repairflow_max_attempts}: $*"
  if "$repairflow_maestro_bin" "$@"; then
    exit 0
  else
    repairflow_status=$?
  fi

  if [ "$repairflow_attempt" -eq "$repairflow_max_attempts" ]; then
    echo "Maestro failed after ${repairflow_max_attempts} attempts." >&2
    exit "$repairflow_status"
  fi

  echo "Maestro attempt ${repairflow_attempt} failed; resetting transient device transport before retry."
  if command -v adb >/dev/null 2>&1 && adb get-state >/dev/null 2>&1; then
    adb forward --remove-all >/dev/null 2>&1 || true
    adb wait-for-device
  fi
  sleep 5
  repairflow_attempt=$((repairflow_attempt + 1))
done
