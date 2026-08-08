# Known limitations

- The iOS artefact is an unsigned Simulator build for reproducible local verification. App Store signing and distribution credentials are intentionally outside the repository.
- The macOS package is unsigned and suitable for controlled verification. Production notarisation requires an external Apple Developer identity.
- The Windows portable package is unsigned. Production code signing requires an external certificate.
- The Android APK is built and release-bundle verified in CI, but physical-device startup and camera behaviour are not part of the current release gate and should be validated on target hardware before operational deployment.
- The desktop v1.0.0 client keeps operational work inside the Workshop workspace. Intake is opened from **New intake** and case work is performed from the selected case tabs.
- Curated product screenshots are documentation and are not treated as automated test evidence.
- Local Prometheus and Grafana services are opt-in development operations tooling rather than a hosted monitoring service.
