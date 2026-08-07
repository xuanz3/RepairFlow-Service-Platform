# Phase 2 Repair Workflows

Phase 2 turns the platform foundations into complete local repair operations across the desktop and mobile clients.

## Vertical workflow

`Device check-in → diagnosis → repair actions → evidence → quality review → ready for delivery`

The service API, Electron client and Expo client share the same statuses, request contracts and workflow rules.

## Desktop boundary

The Electron main process owns a file-backed SQLite database in the application `userData` directory. The renderer has no Node.js access. A context-isolated preload exposes only these promise-based operations:

- list repair cases;
- read one repair case;
- save one repair case;
- reset generated preview data;
- select and secure an evidence file.

Selected evidence is copied into an application-owned directory and hashed with SHA-256 before metadata is stored.

## Mobile boundary

The Expo client uses `expo-sqlite` with WAL mode for repair records. Camera evidence is copied from temporary camera storage to the application document directory. `expo-crypto` hashes the actual file bytes before the evidence record is committed.

The mobile local store is intentionally not a synchronisation outbox. Durable outbox processing, delta pull, tombstones and conflict resolution remain Phase 3 responsibilities.

## Service boundary

The ASP.NET Core service exposes authenticated workflow endpoints for:

- repair case intake and detail;
- diagnosis;
- repair actions and completion;
- evidence metadata;
- status transitions;
- quality review.

Domain methods enforce expected versions and return a conflict result for stale mutations. Full client conflict recovery is introduced in Phase 3.

## End-to-end validation

The desktop renderer has a browser-compatible repository fallback used only by Playwright. The Electron runtime continues to use SQLite through IPC. This allows deterministic workflow automation without weakening the production security boundary.

The mobile Maestro flow is versioned as an executable contract. Device and simulator execution is part of release-candidate validation once signed native packages are introduced.
