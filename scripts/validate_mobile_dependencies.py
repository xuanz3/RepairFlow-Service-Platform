#!/usr/bin/env python3
"""Validate the official Expo SDK 55 dependency lane used by RepairFlow."""
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
dev_deps = manifest.get("devDependencies", {})
required = {
    "expo": "55.0.28",
    "expo-router": "55.0.17",
    "expo-constants": "55.0.17",
    "expo-linking": "55.0.16",
    "expo-status-bar": "55.0.6",
    "expo-sqlite": "55.0.18",
    "expo-secure-store": "55.0.16",
    "react": "19.2.0",
    "react-native": "0.83.10",
    "react-native-safe-area-context": "5.6.2",
    "react-native-screens": "4.23.0",
}
for package, expected in required.items():
    actual = str(deps.get(package, "")).lstrip("^").lstrip("~")
    if actual != expected:
        raise SystemExit(f"{package} must resolve to {expected}; found {deps.get(package)!r}")

if str(dev_deps.get("@types/react", "")).lstrip("^").lstrip("~") != "19.2.10":
    raise SystemExit("@types/react must remain on the Expo-validated SDK 55 version ~19.2.10")

text = lockfile.read_text(encoding="utf-8")
for forbidden in (
    "@react-native/metro-config@0.86.2",
    "@react-native/js-polyfills@0.86.2",
    "@react-native/normalize-colors@0.86.2",
    "react-native@0.86.2",
    "react-native@0.85.1",
    "expo-router@56.",
    "expo@56.",
    "expo@57.",
):
    if forbidden in text:
        raise SystemExit(f"Forbidden incompatible dependency found in lockfile: {forbidden}")

print("Mobile dependency compatibility validation passed for the official Expo SDK 55 lane.")
