#!/usr/bin/env python3
"""Verify the ASP.NET Core foundation follows the pinned service model."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
global_json = json.loads((ROOT / "global.json").read_text(encoding="utf-8"))
sdk_version = global_json.get("sdk", {}).get("version")
if sdk_version != "10.0.302":
    raise SystemExit(f"RepairFlow requires .NET SDK 10.0.302; found {sdk_version!r}")

program = (ROOT / "apps/api/src/RepairFlow.Api/Program.cs").read_text(encoding="utf-8")
required = (
    "WebApplication.CreateBuilder",
    "AddIdentityApiEndpoints",
    "AddAuthorizationBuilder",
    "AddProblemDetails",
    "AddHealthChecks",
    "UseExceptionHandler",
    "MapHealthChecks",
)
for token in required:
    if token not in program:
        raise SystemExit(f"ASP.NET Core foundation requirement is missing: {token}")

for forbidden in ("new WebHostBuilder", "class Startup", "UseDeveloperExceptionPage"):
    if forbidden in program:
        raise SystemExit(f"Outdated ASP.NET Core pattern found: {forbidden}")



test_projects = (
    ROOT / "apps/api/tests/RepairFlow.Domain.Tests/RepairFlow.Domain.Tests.csproj",
    ROOT / "apps/api/tests/RepairFlow.Api.Tests/RepairFlow.Api.Tests.csproj",
)
for project in test_projects:
    content = project.read_text(encoding="utf-8")
    if 'PackageReference Include="xunit"' not in content:
        raise SystemExit(f"xUnit package reference is missing: {project.relative_to(ROOT)}")

test_sources = (
    ROOT / "apps/api/tests/RepairFlow.Domain.Tests/RepairCaseTests.cs",
    ROOT / "apps/api/tests/RepairFlow.Api.Tests/ApiSmokeTests.cs",
)
for source in test_sources:
    content = source.read_text(encoding="utf-8")
    if "using Xunit;" not in content:
        raise SystemExit(f"Explicit xUnit import is missing: {source.relative_to(ROOT)}")

print("ASP.NET Core foundation validation passed.")
