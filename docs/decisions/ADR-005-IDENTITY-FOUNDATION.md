# ADR-005: Use ASP.NET Core Identity API endpoints

## Status

Accepted

## Decision

Use ASP.NET Core Identity with Entity Framework stores and token-based API endpoints. Repair roles are seeded as Admin, Intake, Technician, Quality and Viewer.

## Rationale

The framework provides password policy, token issuance and refresh support without introducing an external identity dependency for local development.

## Consequences

- Object-level repair permissions still require explicit application policies.
- Local generated accounts must never be reused outside the local environment.
- Session and device management are added during the security hardening stage.
