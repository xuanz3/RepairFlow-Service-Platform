#!/usr/bin/env python3
"""Run RepairFlow framework-specific static gates."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for script in ("validate_mobile_dependencies.py", "validate_electron_security.py", "validate_aspnet_foundation.py"):
    subprocess.run([sys.executable, str(ROOT / "scripts" / script)], cwd=ROOT, check=True)
print("Framework implementation gates passed.")
