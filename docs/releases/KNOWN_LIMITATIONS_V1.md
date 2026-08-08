# Known limitations

- The iOS artefact is an unsigned Simulator build for reproducible verification; App Store signing and distribution credentials are intentionally outside the repository.
- The macOS package is unsigned and suitable for controlled verification; production notarisation requires an external Apple Developer identity.
- The Windows portable package is unsigned; production code signing requires an external certificate.
- Mobile camera verification uses simulator/emulator camera facilities during automated release checks; physical-device camera quality is hardware dependent.
- Local Prometheus and Grafana services are opt-in development operations tooling and are not a hosted monitoring service.
