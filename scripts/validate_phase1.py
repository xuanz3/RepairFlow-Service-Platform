#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
required = [
    ROOT / "package.json",
    ROOT / "pnpm-workspace.yaml",
    ROOT / "apps/api/RepairFlow.sln",
    ROOT / "apps/desktop/package.json",
    ROOT / "apps/desktop/electron/main.ts",
    ROOT / "apps/desktop/electron/preload.cts",
    ROOT / "apps/mobile/package.json",
    ROOT / "packages/contracts/package.json",
    ROOT / "packages/validation/package.json",
    ROOT / "packages/design-tokens/package.json",
    ROOT / "packages/api-client/package.json",
    ROOT / "infra/docker-compose.yml",
    ROOT / ".github/workflows/platform-foundation.yml",
]
missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
if missing:
    print("Missing Phase 1 files:")
    print("\n".join(f"- {item}" for item in missing))
    sys.exit(1)

for path in sorted(ROOT.rglob("*.json")):
    if any(part in {"node_modules", "dist", ".expo"} for part in path.parts):
        continue
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SystemExit(f"Invalid JSON in {path.relative_to(ROOT)}: {error}") from error

package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
if package.get("packageManager") != "pnpm@11.9.0":
    raise SystemExit("The root package manager contract is not pinned to pnpm 11.9.0.")
if package.get("scripts", {}).get("validate:phase1") != "python3 scripts/validate_phase1.py":
    raise SystemExit("The Phase 1 repository validator is not exposed by the root workspace.")

workspace = (ROOT / "pnpm-workspace.yaml").read_text(encoding="utf-8")
for entry in ("apps/desktop", "apps/mobile", "packages/*"):
    if entry not in workspace:
        raise SystemExit(f"Workspace entry missing: {entry}")

readme = (ROOT / "README.md").read_text(encoding="utf-8")
if "Phase 1 - Platform Foundation and Service Core" not in readme:
    raise SystemExit("README does not show the Phase 1 stage.")
if readme.count("<!-- product-media:start -->") != 1 or readme.count("<!-- product-media:end -->") != 1:
    raise SystemExit("README product-media markers are invalid.")

public_text_paths = [
    ROOT / "README.md",
    ROOT / "docs",
    ROOT / ".github",
]
for candidate in public_text_paths:
    files = [candidate] if candidate.is_file() else candidate.rglob("*")
    for path in files:
        if not path.is_file() or path.suffix.lower() not in {"", ".md", ".yml", ".yaml", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"\bportfolio\b", text, flags=re.IGNORECASE):
            raise SystemExit(f"Disallowed product wording found in {path.relative_to(ROOT)}.")
        if re.search(r"\bAI\b", text):
            raise SystemExit(f"Disallowed product wording found in {path.relative_to(ROOT)}.")

print("Phase 1 repository validation passed.")
