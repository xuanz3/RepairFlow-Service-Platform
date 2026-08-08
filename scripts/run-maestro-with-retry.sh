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

capture_diagnostics() {
  repairflow_diagnostic_dir="${MAESTRO_DIAGNOSTIC_DIR:-}"
  [ -n "$repairflow_diagnostic_dir" ] || return 0
  mkdir -p "$repairflow_diagnostic_dir"

  repairflow_latest_maestro=""
  if [ -d "$HOME/.maestro/tests" ]; then
    while IFS= read -r repairflow_candidate; do
      repairflow_latest_maestro="$repairflow_candidate"
    done < <(find "$HOME/.maestro/tests" -mindepth 1 -maxdepth 1 -type d -print | LC_ALL=C sort)
  fi
  if [ -n "$repairflow_latest_maestro" ]; then
    cp -R "$repairflow_latest_maestro" "$repairflow_diagnostic_dir/maestro-latest" || true
  fi

  if command -v adb >/dev/null 2>&1 && adb get-state >/dev/null 2>&1; then
    adb logcat -d -v threadtime > "$repairflow_diagnostic_dir/android-logcat.txt" 2>&1 || true
    adb shell dumpsys activity activities > "$repairflow_diagnostic_dir/android-activity.txt" 2>&1 || true
    adb shell dumpsys window windows > "$repairflow_diagnostic_dir/android-window.txt" 2>&1 || true
    adb shell uiautomator dump /sdcard/repairflow-ui.xml >/dev/null 2>&1 || true
    adb pull /sdcard/repairflow-ui.xml "$repairflow_diagnostic_dir/android-ui.xml" >/dev/null 2>&1 || true
    adb exec-out screencap -p > "$repairflow_diagnostic_dir/android-screen.png" 2>/dev/null || true
  fi

  if command -v xcrun >/dev/null 2>&1 && [ -n "${MAESTRO_IOS_UDID:-}" ]; then
    xcrun simctl io "$MAESTRO_IOS_UDID" screenshot \
      "$repairflow_diagnostic_dir/ios-screen.png" >/dev/null 2>&1 || true
  fi
}

repairflow_attempt=1
while [ "$repairflow_attempt" -le "$repairflow_max_attempts" ]; do
  echo "Maestro attempt ${repairflow_attempt}/${repairflow_max_attempts}: $*"
  if "$repairflow_maestro_bin" "$@"; then
    exit 0
  else
    repairflow_status=$?
  fi

  if [ "$repairflow_attempt" -eq "$repairflow_max_attempts" ]; then
    capture_diagnostics
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
