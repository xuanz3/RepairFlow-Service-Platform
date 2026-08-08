# v1 installation and verification

## Desktop

Use the generated macOS, Windows or Linux artefact from the release. Each package is validated through the same compiled Electron main process and deterministic local SQLite workflow data before publication.

Unsigned desktop artefacts may require the operating system's normal local-development approval flow. No signing identity is stored in the repository.

## Mobile

The Android release APK is installed and exercised on an emulator with an offline restart scenario. The iOS release is built for iOS Simulator, installed with `simctl` and exercised through the same Maestro release smoke flow.

## Integrity

Verify files against `SHA256SUMS`. `repairflow-sbom.cdx.json` records the JavaScript and locked NuGet dependency inventory used for the release.
