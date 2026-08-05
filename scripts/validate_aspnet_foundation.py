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

print("ASP.NET Core foundation validation passed.")
