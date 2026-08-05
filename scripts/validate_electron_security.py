#!/usr/bin/env python3
"""Verify the Electron shell keeps the required security boundary."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
main = (ROOT / "apps/desktop/electron/main.ts").read_text(encoding="utf-8")
preload = (ROOT / "apps/desktop/electron/preload.cts").read_text(encoding="utf-8")

required_main = (
    "contextIsolation: true",
    "nodeIntegration: false",
    "sandbox: true",
    "setWindowOpenHandler",
    "return { action: 'deny' }",
)
for token in required_main:
    if token not in main:
        raise SystemExit(f"Electron security requirement is missing: {token}")

for forbidden in ("remote.require", "enableRemoteModule: true", "nodeIntegration: true"):
    if forbidden in main or forbidden in preload:
        raise SystemExit(f"Forbidden Electron configuration found: {forbidden}")

print("Electron security baseline validation passed.")
