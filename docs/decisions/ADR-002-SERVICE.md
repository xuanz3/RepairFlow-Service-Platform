# ADR-002: ASP.NET Core modular monolith

## Context

The product needs identity, authorisation, data consistency, file metadata, real-time updates and background operations without operational complexity.

## Decision

Use ASP.NET Core with PostgreSQL as a modular monolith for v1.

## Consequences

The system can be developed and tested locally with low operational risk. Modules remain separable if measured workloads later justify independent processes.
