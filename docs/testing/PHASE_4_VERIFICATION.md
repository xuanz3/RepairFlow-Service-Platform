# Phase 4 verification

The release gate combines retained Phase 0-3 validation with deterministic cross-platform package builds. Automated product-media capture is intentionally not a release gate because emulator/simulator UI automation was the only unstable CI component and did not affect package creation.

- Windows, macOS and Linux Electron packages are built from the reviewed source and the compiled desktop runtime executes a local-data smoke check.
- Android produces the release APK directly through the generated native project and Gradle.
- iOS produces an unsigned Simulator release application directly through CocoaPods and Xcode.
- Desktop end-to-end and accessibility checks remain part of release quality.
- The release bundle contains the five platform artefacts, build metadata, SHA-256 checksums, CycloneDX SBOM, release notes and known limitations.
- Mobile emulator/simulator screenshot capture and Maestro release-media execution are excluded from CI release gating.
