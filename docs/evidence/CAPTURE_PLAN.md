# Product Media Plan

RepairFlow v1 uses a manually curated product walkthrough for repository documentation. The published set contains ten screenshots under `docs/images/product/` and is capped at fifteen images so the repository home page remains focused.

The current walkthrough covers:

- desktop workshop overview and device intake;
- diagnosis, repair actions, evidence, quality review and synchronisation;
- mobile workshop intake, mobile device check-in and device-label scanning.

Product media is documentation rather than a blocking release check. Native package generation, runtime checks that are supported by CI, accessibility checks, service tests, checksums and SBOM generation remain mandatory.

The existing Playwright, Maestro, Mermaid and Sharp media tooling is retained as optional source tooling. Its legacy capture manifest remains separate from the curated README image set and must not prevent Android, iOS Simulator, macOS, Windows or Linux packages from being produced.
