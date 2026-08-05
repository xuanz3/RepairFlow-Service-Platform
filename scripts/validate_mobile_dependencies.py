#!/usr/bin/env python3
"""Validate that the mobile workspace remains on the approved Expo SDK 56 lane."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
mobile_manifest = ROOT / "apps" / "mobile" / "package.json"
lockfile = ROOT / "pnpm-lock.yaml"

if not mobile_manifest.exists():
    raise SystemExit("apps/mobile/package.json is missing")
if not lockfile.exists():
    raise SystemExit("pnpm-lock.yaml is missing")

manifest = json.loads(mobile_manifest.read_text(encoding="utf-8"))
deps = manifest.get("dependencies", {})
required = {
    "expo": "56.0.12",
    "react": "19.2.3",
    "react-native": "0.85.1",
}
for package, expected in required.items():
    actual = str(deps.get(package, "")).lstrip("^").lstrip("~")
    if actual != expected:
        raise SystemExit(f"{package} must resolve to {expected}; found {deps.get(package)!r}")

if "expo-router" not in deps:
    raise SystemExit("expo-router must be installed through the Expo compatibility map")

text = lockfile.read_text(encoding="utf-8")
for forbidden in (
    "@react-native/metro-config@0.86.2",
    "@react-native/js-polyfills@0.86.2",
    "@react-native/normalize-colors@0.86.2",
    "react-native@0.86.2",
):
    if forbidden in text:
        raise SystemExit(f"Forbidden incompatible dependency found in lockfile: {forbidden}")

print("Mobile dependency compatibility validation passed.")
