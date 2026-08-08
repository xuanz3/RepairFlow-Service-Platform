# Product Media Plan

Automated product-media capture is not part of the RepairFlow v1 release gate. Native package generation, runtime checks, accessibility checks, service tests, checksums and SBOM generation remain mandatory.

The existing Playwright, Maestro, Mermaid and Sharp media tooling is retained as optional source tooling for future manual or non-blocking media generation. It must not prevent Android, iOS Simulator, macOS, Windows or Linux release packages from being produced.

The repository keeps a maximum of 18 final evidence images when media is generated intentionally. No final image set is required for v1.0.0.
