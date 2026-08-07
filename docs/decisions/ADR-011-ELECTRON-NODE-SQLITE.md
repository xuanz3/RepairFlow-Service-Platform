# ADR-011: Electron local workflow store uses node:sqlite

## Status

Accepted.

## Context

The desktop client requires a real SQLite local store without adding a native addon rebuild pipeline. Electron 43 embeds Node.js 24, which provides `node:sqlite`.

## Decision

The Electron main process owns `DatabaseSync` and stores complete repair workflow documents in an indexed SQLite table. The renderer accesses the store only through explicit `ipcRenderer.invoke` calls exposed by a context-isolated preload.

## Consequences

- no `better-sqlite3` native rebuild is required;
- the renderer retains `nodeIntegration: false` and `sandbox: true`;
- database access remains synchronous inside the main process and must stay limited to small local workflow operations;
- large data and synchronisation workloads move to Phase 3 background services.
