#!/usr/bin/env python3
"""Validate retained and specialised RepairFlow Maestro workflow contracts."""
from __future__ import annotations

from collections import Counter
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
FLOW_DIR = ROOT / "apps" / "mobile" / "maestro"
HEADER = "appId: com.xuanz3.repairflow.mobile\n---\n"

errors: list[str] = []
flows = {flow.name: flow for flow in sorted(FLOW_DIR.glob("*.yaml"))}
if not flows:
    errors.append("No Maestro workflow files were found.")

for flow in flows.values():
    text = flow.read_text(encoding="utf-8")
    if not text.startswith(HEADER):
        errors.append(f"{flow.relative_to(ROOT)} has an invalid app identifier or document header.")
    if "launchApp" not in text:
        errors.append(f"{flow.relative_to(ROOT)} must launch the installed application.")

suite_contracts: dict[str, set[str]] = {
    "intake-and-diagnosis.yaml": {
        "mobile-new-intake",
        "save-intake",
        "mobile-save-diagnosis",
    },
    "release-smoke.yaml": {
        "mobile-new-intake",
        "save-intake",
        "stopApp",
        "Release Verification",
    },
    "release-media-android.yaml": {
        "setAirplaneMode",
        "14-mobile-offline-queue",
    },
    "release-media-ios.yaml": {
        "mobile-new-intake",
        "mobile-scan-qr",
        "mobile-capture-evidence",
        "mobile-tab-diagnosis",
        "08-mobile-work-queue",
        "09-mobile-device-check-in",
        "10-mobile-qr-lookup",
        "11-mobile-condition-capture",
        "12-mobile-annotation",
        "13-mobile-diagnosis",
    },
}

for name, required_tokens in suite_contracts.items():
    flow = flows.get(name)
    if flow is None:
        errors.append(f"Required Maestro workflow is missing: apps/mobile/maestro/{name}")
        continue
    text = flow.read_text(encoding="utf-8")
    missing = sorted(token for token in required_tokens if token not in text)
    if missing:
        errors.append(
            f"{flow.relative_to(ROOT)} is missing suite contract tokens: {', '.join(missing)}"
        )

expected_mobile_captures = {
    "08-mobile-work-queue",
    "09-mobile-device-check-in",
    "10-mobile-qr-lookup",
    "11-mobile-condition-capture",
    "12-mobile-annotation",
    "13-mobile-diagnosis",
    "14-mobile-offline-queue",
}

capture_names: list[str] = []
for flow in flows.values():
    text = flow.read_text(encoding="utf-8")
    capture_names.extend(re.findall(r"""takeScreenshot:\s*[\'"]([^\'"]+)[\'"]""", text))

capture_counts = Counter(capture_names)
missing_captures = sorted(expected_mobile_captures - set(capture_names))
unexpected_captures = sorted(set(capture_names) - expected_mobile_captures)
duplicated_captures = sorted(name for name, count in capture_counts.items() if count != 1)
if missing_captures:
    errors.append("Missing approved mobile media captures: " + ", ".join(missing_captures))
if unexpected_captures:
    errors.append("Unexpected mobile media captures: " + ", ".join(unexpected_captures))
if duplicated_captures:
    errors.append("Mobile media captures must appear exactly once: " + ", ".join(duplicated_captures))

if errors:
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    raise SystemExit(1)

print(f"Maestro workflow suite validation passed ({len(flows)} flows).")
