# Phase 4 verification

The Phase 4 gate combines retained Phase 0-3 validation with deterministic cross-platform package builds. Product screenshots are maintained separately as repository documentation so media capture cannot block release packaging.

- Windows, macOS and Linux Electron packages are built from reviewed source and the compiled desktop runtime executes a local-data smoke check.
- Android produces a release APK through the generated native project and Gradle. The release gate verifies package generation and bundle integrity rather than physical-device startup.
- iOS produces an unsigned Simulator release application through CocoaPods and Xcode.
- Desktop end-to-end and accessibility checks remain part of release quality.
- Service builds, tests and Docker Compose configuration checks remain blocking.
- The release bundle contains the five platform artefacts, build metadata, SHA-256 checksums, CycloneDX SBOM, release notes and known limitations.
- Mobile emulator/simulator screenshot capture and Maestro release-media execution are excluded from release gating.
