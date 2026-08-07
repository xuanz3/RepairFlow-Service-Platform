#!/usr/bin/env python3
"""Validate retained RepairFlow Phase 2 workflow capabilities across later releases."""
from __future__ import annotations

import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
required_files = (
    "apps/api/src/RepairFlow.Api/RepairCaseEndpoints.cs",
    "apps/api/src/RepairFlow.Application/RepairCaseWorkflowService.cs",
    "apps/api/src/RepairFlow.Domain/DiagnosisRecord.cs",
    "apps/api/src/RepairFlow.Domain/RepairAction.cs",
    "apps/api/src/RepairFlow.Domain/QualityReview.cs",
    "apps/desktop/electron/workflowStore.ts",
    "apps/desktop/src/workflowModel.ts",
    "apps/desktop/tests/e2e/workshop-flow.e2e.ts",
    "apps/mobile/src/localWorkflowStore.ts",
    "apps/mobile/src/evidenceFiles.ts",
    "apps/mobile/app/intake.tsx",
    "apps/mobile/app/scan.tsx",
    "apps/mobile/app/case/[id]/evidence.tsx",
    "apps/mobile/maestro/intake-and-diagnosis.yaml",
    "tools/verify/mobile-maestro.command",
    "docs/architecture/PHASE_2_REPAIR_WORKFLOWS.md",
    "docs/testing/PHASE_2_VERIFICATION.md",
    "docs/releases/v0.3.0-desktop-preview.md",
    "docs/releases/v0.4.0-mobile-preview.md",
)

errors: list[str] = []
for relative in required_files:
    if not (ROOT / relative).exists():
        errors.append(f"Missing Phase 2 file: {relative}")


def release_version(value: object, label: str) -> tuple[int, int, int] | None:
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)(?:[-+].*)?", str(value or ""))
    if not match:
        errors.append(f"{label} has an invalid semantic version: {value!r}")
        return None
    return tuple(int(part) for part in match.groups())


def require_version_at_least(value: object, minimum: tuple[int, int, int], label: str) -> None:
    parsed = release_version(value, label)
    if parsed is not None and parsed < minimum:
        minimum_text = ".".join(str(part) for part in minimum)
        errors.append(f"{label} must remain at or beyond the Phase 2 baseline {minimum_text}.")


root_manifest = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
require_version_at_least(root_manifest.get("version"), (0, 4, 0), "Root package version")
root_scripts = root_manifest.get("scripts", {})
verify_script = str(root_scripts.get("verify", ""))
for forbidden in (
    "pnpm validate:",
    "pnpm format:check",
    "pnpm lint",
    "pnpm typecheck",
    "pnpm test",
    "pnpm build",
):
    if forbidden in verify_script:
        errors.append(f"Root verify script must not recursively resolve pnpm from PATH: {forbidden}")
if "python3 scripts/validate_phase2.py" not in verify_script or "turbo run build" not in verify_script:
    errors.append("Root verify script does not retain the self-contained Phase 2 capability gate.")
if root_scripts.get("e2e:desktop") != "npm --prefix apps/desktop run e2e":
    errors.append("Desktop e2e runner must execute from the desktop package without nested pnpm lookup.")
if root_scripts.get("verify:phase2") != "npm run verify && npm run e2e:desktop":
    errors.append("Phase 2 verification runner must compose the self-contained verify and desktop e2e scripts.")

desktop_manifest = json.loads((ROOT / "apps/desktop/package.json").read_text(encoding="utf-8"))
require_version_at_least(desktop_manifest.get("version"), (0, 3, 0), "Desktop package version")
mobile_manifest = json.loads((ROOT / "apps/mobile/package.json").read_text(encoding="utf-8"))
require_version_at_least(mobile_manifest.get("version"), (0, 4, 0), "Mobile package version")

platform_workflow = (ROOT / ".github/workflows/platform-foundation.yml").read_text(encoding="utf-8")
repair_workflow = (ROOT / ".github/workflows/repair-workflows.yml").read_text(encoding="utf-8")
mobile_turbo_typecheck = "pnpm exec turbo run typecheck --filter=@repairflow/mobile"
if mobile_turbo_typecheck not in platform_workflow:
    errors.append("Platform Foundation must typecheck mobile through the Turborepo dependency graph.")
if mobile_turbo_typecheck not in repair_workflow:
    errors.append("Repair Workflows must typecheck mobile through the Turborepo dependency graph.")
if "pnpm exec turbo run test --filter=@repairflow/mobile" not in repair_workflow:
    errors.append("Repair Workflows must test mobile through the Turborepo dependency graph.")
for workflow_name, workflow_text in (("Platform Foundation", platform_workflow), ("Repair Workflows", repair_workflow)):
    if "pnpm --filter @repairflow/mobile typecheck" in workflow_text:
        errors.append(f"{workflow_name} must not invoke raw mobile typecheck before workspace dependency builds.")

playwright_config = (ROOT / "apps/desktop/playwright.config.ts").read_text(encoding="utf-8")
for token in (
    "process.execPath",
    "./node_modules/vite/bin/vite.js preview",
    "screenshot: 'off'",
    "reuseExistingServer: false",
):
    if token not in playwright_config:
        errors.append(f"Playwright deterministic preview contract is missing: {token}")
for forbidden_command in ("pnpm build", "pnpm preview"):
    if forbidden_command in playwright_config:
        errors.append(f"Playwright web server must not depend on shell pnpm PATH: {forbidden_command}")

readme = (ROOT / "README.md").read_text(encoding="utf-8")
for token in (
    "Desktop workshop queue",
    "Electron SQLite workflow store",
    "Expo Camera",
    "Playwright",
    "Maestro",
):
    if token not in readme:
        errors.append(f"README no longer documents retained Phase 2 capability: {token}")

for forbidden in (
    "port" + "folio",
    "job " + "search",
    "student " + "project",
    "generated by " + "A" + "I",
):
    if forbidden.lower() in readme.lower():
        errors.append(f"README contains prohibited product framing: {forbidden}")

if errors:
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    raise SystemExit(1)

print("Phase 2 retained-capability validation passed.")
