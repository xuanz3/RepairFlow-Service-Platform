#!/usr/bin/env python3
"""Create and validate an isolated mobile dependency manifest before workspace install."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "apps" / "mobile" / "package.json"
PNPM = sys.argv[1] if len(sys.argv) > 1 else "pnpm"

if not MANIFEST.exists():
    raise SystemExit("apps/mobile/package.json is missing")

source = json.loads(MANIFEST.read_text(encoding="utf-8"))
external = {
    name: version
    for name, version in source.get("dependencies", {}).items()
    if not str(version).startswith("workspace:")
}
preflight = {
    "name": "repairflow-mobile-dependency-preflight",
    "version": "0.0.0",
    "private": True,
    "dependencies": external,
    "devDependencies": source.get("devDependencies", {}),
}

with tempfile.TemporaryDirectory(prefix="repairflow-mobile-preflight-") as tmp:
    work = Path(tmp)
    (work / "package.json").write_text(json.dumps(preflight, indent=2) + "\n", encoding="utf-8")
    subprocess.run(
        [PNPM, "install", "--lockfile-only", "--ignore-scripts"],
        cwd=work,
        check=True,
    )
    lockfile = work / "pnpm-lock.yaml"
    if not lockfile.exists():
        raise SystemExit("Mobile dependency preflight did not produce a lockfile")
    text = lockfile.read_text(encoding="utf-8")
    forbidden = (
        "react-native@0.84.",
        "react-native@0.85.",
        "react-native@0.86.",
        "expo-router@56.",
        "expo@56.",
        "expo@57.",
        "@react-native/metro-config@0.86.",
        "@react-native/js-polyfills@0.86.",
        "@react-native/normalize-colors@0.86.",
    )
    for token in forbidden:
        if token in text:
            raise SystemExit(f"Mobile dependency preflight rejected incompatible dependency: {token}")

    for package, version in (
        ("expo-camera", "55.0.21"),
        ("expo-file-system", "55.0.24"),
        ("expo-crypto", "55.0.17"),
    ):
        if f"{package}@{version}" not in text:
            raise SystemExit(
                f"Mobile dependency preflight did not resolve the required SDK 55 package: {package}@{version}"
            )

print("Isolated mobile dependency preflight passed.")
