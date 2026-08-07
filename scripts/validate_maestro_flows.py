#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
FLOW_DIR = ROOT / "apps" / "mobile" / "maestro"
required_tokens = {
    "appId:",
    "launchApp",
    "mobile-new-intake",
    "save-intake",
    "mobile-save-diagnosis",
}

errors: list[str] = []
flows = sorted(FLOW_DIR.glob("*.yaml"))
if not flows:
    errors.append("No Maestro workflow files were found.")

for flow in flows:
    text = flow.read_text(encoding="utf-8")
    missing = sorted(token for token in required_tokens if token not in text)
    if missing:
        errors.append(f"{flow.relative_to(ROOT)} is missing: {', '.join(missing)}")
    if not text.startswith("appId: com.xuanz3.repairflow.mobile\n---\n"):
        errors.append(f"{flow.relative_to(ROOT)} has an invalid app identifier or document header.")

if errors:
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    raise SystemExit(1)

print(f"Maestro flow contract validation passed ({len(flows)} flow).")
