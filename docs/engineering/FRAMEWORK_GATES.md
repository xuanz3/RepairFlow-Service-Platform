# Framework implementation gates

RepairFlow uses framework-specific gates to keep the mobile, desktop and service foundations reproducible.

## Mobile lane

- The Expo, Expo Router, React and React Native versions must come from one official Expo template branch.
- The complete mobile dependency lane is pinned; framework packages are not selected independently.
- A temporary dependency-resolution sandbox must pass before the repository lockfile is changed.
- `expo install --check` verifies the completed install. It is not used to rewrite versions.
- A React Native minor version outside the approved lane is a release-blocking error.

## Desktop lane

- Electron renderer processes cannot access Node.js directly.
- Context isolation and sandboxing remain enabled.
- External navigation is denied in the application window and delegated to the operating system.
- Main and preload boundaries are type-checked separately from renderer code.

## Service lane

- The SDK and target framework are pinned to .NET 10.
- ASP.NET Core built-ins are preferred for dependency injection, Identity, authorization, ProblemDetails, OpenAPI and health checks.
- Package restore uses lock files and CI uses locked mode.
- Domain and API verification run without requiring production infrastructure.

## Change rule

Framework upgrades require an ADR, an isolated compatibility check, lockfile review and the full platform verification suite. Version changes must not be mixed with product features.
