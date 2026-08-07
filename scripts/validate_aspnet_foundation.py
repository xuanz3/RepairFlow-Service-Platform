#!/usr/bin/env python3
"""Verify the ASP.NET Core service follows the pinned workflow model."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
global_json = json.loads((ROOT / "global.json").read_text(encoding="utf-8"))
sdk_version = global_json.get("sdk", {}).get("version")
if sdk_version != "10.0.302":
    raise SystemExit(f"RepairFlow requires .NET SDK 10.0.302; found {sdk_version!r}")

program = (ROOT / "apps/api/src/RepairFlow.Api/Program.cs").read_text(encoding="utf-8")
required_program = (
    "WebApplication.CreateBuilder",
    "AddIdentityApiEndpoints",
    "AddAuthorizationBuilder",
    "AddProblemDetails",
    "AddHealthChecks",
    "UseExceptionHandler",
    "MapHealthChecks",
    "MapRepairCaseEndpoints",
    "JsonStringEnumConverter",
    "JsonNamingPolicy.KebabCaseLower",
)
for token in required_program:
    if token not in program:
        raise SystemExit(f"ASP.NET Core requirement is missing: {token}")

endpoints = (ROOT / "apps/api/src/RepairFlow.Api/RepairCaseEndpoints.cs").read_text(encoding="utf-8")
for token in (
    "/{id:guid}/diagnosis",
    "/{id:guid}/repair-actions",
    "/{id:guid}/evidence",
    "/{id:guid}/quality-reviews",
    "Status409Conflict",
    "RequireAuthorization",
):
    if token not in endpoints:
        raise SystemExit(f"Repair workflow endpoint requirement is missing: {token}")

domain = (ROOT / "apps/api/src/RepairFlow.Domain/RepairCase.cs").read_text(encoding="utf-8")
for token in (
    "RecordDiagnosis",
    "AddRepairAction",
    "CompleteRepairAction",
    "AddEvidence",
    "SubmitQualityReview",
    "RepairCaseVersionConflictException",
):
    if token not in domain:
        raise SystemExit(f"Repair domain workflow requirement is missing: {token}")

for forbidden in ("new WebHostBuilder", "class Startup", "UseDeveloperExceptionPage"):
    if forbidden in program:
        raise SystemExit(f"Outdated ASP.NET Core pattern found: {forbidden}")

test_sources = (
    ROOT / "apps/api/tests/RepairFlow.Domain.Tests/RepairCaseTests.cs",
    ROOT / "apps/api/tests/RepairFlow.Api.Tests/ApiSmokeTests.cs",
)
for source in test_sources:
    content = source.read_text(encoding="utf-8")
    if "using Xunit;" not in content:
        raise SystemExit(f"Explicit xUnit import is missing: {source.relative_to(ROOT)}")

print("ASP.NET Core workflow validation passed.")
