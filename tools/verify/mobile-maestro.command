#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
command -v maestro >/dev/null 2>&1 || {
  printf 'Maestro is not installed. Install the Maestro CLI before running this optional device gate.\n' >&2
  exit 1
}

maestro test "$ROOT/apps/mobile/maestro"
