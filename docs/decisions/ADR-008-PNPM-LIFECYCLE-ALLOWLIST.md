# ADR-008: Restrict dependency lifecycle scripts with a repository allowlist

## Status
Accepted

## Context
RepairFlow uses pnpm 11, which fails installation when a dependency lifecycle script is not explicitly approved. Electron requires an install step to obtain its runtime binary, and esbuild verifies or installs its platform binary during installation.

## Decision
Declare a repository-level `allowBuilds` map in `pnpm-workspace.yaml` and approve only `electron` and `esbuild`. Retain the pnpm 10 `onlyBuiltDependencies` spelling for contributors using the previous major version.

## Consequences
- Dependency lifecycle scripts remain blocked by default.
- New packages with install scripts require an explicit reviewed configuration change.
- Local development and CI resolve the same approved lifecycle scripts non-interactively.
- The project does not use `dangerouslyAllowAllBuilds` or disable strict dependency-build checks.
