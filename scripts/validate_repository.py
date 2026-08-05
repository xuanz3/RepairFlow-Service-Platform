from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
required = [
    root / "README.md",
    root / "SECURITY.md",
    root / "CONTRIBUTING.md",
    root / "docs/roadmap/FIVE_PHASE_PLAN.md",
    root / "docs/design/DESIGN_DIRECTION.md",
    root / "docs/evidence/CAPTURE_PLAN.md",
]
missing = [str(path.relative_to(root)) for path in required if not path.exists()]
if missing:
    raise SystemExit("Missing required files: " + ", ".join(missing))

readme = (root / "README.md").read_text(encoding="utf-8")
for marker in ("<!-- product-media:start -->", "<!-- product-media:end -->"):
    if readme.count(marker) != 1:
        raise SystemExit(f"README marker must appear exactly once: {marker}")

plan = (root / "docs/roadmap/FIVE_PHASE_PLAN.md").read_text(encoding="utf-8")
phase_headings = re.findall(r"^## Phase [0-4] - ", plan, flags=re.MULTILINE)
if len(phase_headings) != 5:
    raise SystemExit(f"Expected exactly five Phase headings, found {len(phase_headings)}")

final_dir = root / "docs/evidence/final"
images = []
if final_dir.exists():
    images = [p for p in final_dir.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}]
if len(images) > 18:
    raise SystemExit(f"Final image limit exceeded: {len(images)}")

print("Repository validation passed.")
