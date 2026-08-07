# Phase 4 verification

The release gate combines retained Phase 0-3 validation with Phase 4 packaging and product-media requirements.

- Windows, macOS and Linux Electron packages are built from the reviewed source and the compiled runtime executes a local-data smoke check.
- Android and iOS Simulator release builds are installed before Maestro smoke validation.
- Android runs the local queue while airplane mode is enabled to verify offline access.
- Desktop accessibility is scanned for serious/critical WCAG violations with reduced motion and enlarged text checks.
- Exactly 18 deterministic final images are generated from app states, Mermaid diagrams and release evidence.
- Release bundles contain build metadata, SHA-256 checksums, CycloneDX SBOM, release notes and known limitations.
