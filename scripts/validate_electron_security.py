#!/usr/bin/env python3
"""Verify Electron security, SQLite and evidence IPC boundaries."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
main = (ROOT / "apps/desktop/electron/main.ts").read_text(encoding="utf-8")
preload = (ROOT / "apps/desktop/electron/preload.cts").read_text(encoding="utf-8")
store = (ROOT / "apps/desktop/electron/workflowStore.ts").read_text(encoding="utf-8")

required_main = (
    "contextIsolation: true",
    "nodeIntegration: false",
    "sandbox: true",
    "setWindowOpenHandler",
    "url.startsWith('https://')",
    "return { action: 'deny' }",
    "createHash('sha256')",
    "app.getPath('userData')",
)
for token in required_main:
    if token not in main:
        raise SystemExit(f"Electron security requirement is missing: {token}")

required_preload = (
    "contextBridge.exposeInMainWorld",
    "ipcRenderer.invoke('workflow:list')",
    "ipcRenderer.invoke('workflow:get'",
    "ipcRenderer.invoke('workflow:save'",
    "ipcRenderer.invoke('workflow:reset')",
    "ipcRenderer.invoke('workflow:select-evidence')",
)
for token in required_preload:
    if token not in preload:
        raise SystemExit(f"Electron preload boundary is missing: {token}")

required_store = (
    "from 'node:sqlite'",
    "PRAGMA journal_mode = WAL",
    "workflow_cases",
)
for token in required_store:
    if token not in store:
        raise SystemExit(f"Electron SQLite requirement is missing: {token}")

for forbidden in (
    "remote.require",
    "enableRemoteModule: true",
    "nodeIntegration: true",
    "contextIsolation: false",
    "ipcRenderer.send(",
    "shell.openExternal(url);\n    return { action: 'allow' }",
):
    if forbidden in main or forbidden in preload:
        raise SystemExit(f"Forbidden Electron configuration found: {forbidden}")

print("Electron security and local workflow boundary validation passed.")
