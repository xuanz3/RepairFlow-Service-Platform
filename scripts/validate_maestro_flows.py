#!/usr/bin/env python3
"""Validate retained and specialised RepairFlow Maestro workflow contracts."""
from __future__ import annotations

from collections import Counter
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
FLOW_DIR = ROOT / "apps" / "mobile" / "maestro"
HEADER = "appId: com.xuanz3.repairflow.mobile\n---\n"

errors: list[str] = []
flows = {flow.name: flow for flow in sorted(FLOW_DIR.glob("*.yaml"))}
if not flows:
    errors.append("No Maestro workflow files were found.")

for flow in flows.values():
    text = flow.read_text(encoding="utf-8")
    if not text.startswith(HEADER):
        errors.append(f"{flow.relative_to(ROOT)} has an invalid app identifier or document header.")
    if "launchApp" not in text:
        errors.append(f"{flow.relative_to(ROOT)} must launch the installed application.")

suite_contracts: dict[str, set[str]] = {
    "intake-and-diagnosis.yaml": {
        "mobile-home",
        "mobile-new-intake",
        "save-intake",
        "mobile-save-diagnosis",
    },
    "release-smoke.yaml": {
        "mobile-home",
        "mobile-new-intake",
        "mobile-route-back",
        "mobile-case-customer-release-verification",
        "save-intake",
        "stopApp",
        "Release Verification",
    },
    "release-media-android.yaml": {
        "mobile-home",
        "mobile-local-queue-protected",
        "setAirplaneMode",
        "14-mobile-offline-queue",
    },
    "release-media-ios.yaml": {
        "mobile-home",
        "mobile-route-back",
        "mobile-new-intake",
        "mobile-scan-qr",
        "mobile-capture-evidence",
        "mobile-tab-diagnosis",
        "08-mobile-work-queue",
        "09-mobile-device-check-in",
        "10-mobile-qr-lookup",
        "11-mobile-condition-capture",
        "12-mobile-annotation",
        "13-mobile-diagnosis",
    },
}

for name, required_tokens in suite_contracts.items():
    flow = flows.get(name)
    if flow is None:
        errors.append(f"Required Maestro workflow is missing: apps/mobile/maestro/{name}")
        continue
    text = flow.read_text(encoding="utf-8")
    missing = sorted(token for token in required_tokens if token not in text)
    if missing:
        errors.append(
            f"{flow.relative_to(ROOT)} is missing suite contract tokens: {', '.join(missing)}"
        )

for flow in flows.values():
    if re.search(r"(?m)^- back\s*$", flow.read_text(encoding="utf-8")):
        errors.append(
            f"{flow.relative_to(ROOT)} uses Maestro back, which is not supported by the iOS release lane."
        )

app_selector_contracts = {
    ROOT / "apps" / "mobile" / "app" / "_layout.tsx": {"mobile-route-back"},
    ROOT / "apps" / "mobile" / "app" / "index.tsx": {
        "mobile-case-customer-",
        "mobile-home",
        "mobile-local-queue-protected",
    },
}
for source, required_tokens in app_selector_contracts.items():
    if not source.is_file():
        errors.append(f"Mobile selector source is missing: {source.relative_to(ROOT)}")
        continue
    text = source.read_text(encoding="utf-8")
    missing = sorted(token for token in required_tokens if token not in text)
    if missing:
        errors.append(
            f"{source.relative_to(ROOT)} is missing Maestro selector tokens: {', '.join(missing)}"
        )

workflow = (ROOT / ".github" / "workflows" / "phase4-release-candidate.yml").read_text(
    encoding="utf-8"
)
for token in [
    "Prepare Android emulator acceleration",
    "sudo chmod 0666 /dev/kvm || true",
    "disable-linux-hw-accel: auto",
    "-gpu software",
    "MAESTRO_DIAGNOSTIC_DIR: artifacts/diagnostics/android",
    "MAESTRO_DIAGNOSTIC_DIR: artifacts/diagnostics/ios",
    "diagnostics-android",
    "diagnostics-ios",
]:
    if token not in workflow:
        errors.append(f"Phase 4 workflow is missing native verification token: {token}")
for forbidden in [
    "sudo udevadm control --reload-rules",
    "sudo udevadm trigger --name-match=kvm",
    "test -r /dev/kvm",
    "test -w /dev/kvm",
]:
    if forbidden in workflow:
        errors.append(f"Phase 4 workflow still contains a fatal KVM preflight command: {forbidden}")
if "-gpu swiftshader_indirect" in workflow:
    errors.append("Phase 4 workflow must not use the deprecated swiftshader_indirect renderer.")

retry_helper = (ROOT / "scripts" / "run-maestro-with-retry.sh").read_text(encoding="utf-8")
for token in ["capture_diagnostics", "android-logcat.txt", "android-ui.xml", "ios-screen.png"]:
    if token not in retry_helper:
        errors.append(f"Maestro retry helper is missing diagnostic token: {token}")

expected_mobile_captures = {
    "08-mobile-work-queue",
    "09-mobile-device-check-in",
    "10-mobile-qr-lookup",
    "11-mobile-condition-capture",
    "12-mobile-annotation",
    "13-mobile-diagnosis",
    "14-mobile-offline-queue",
}

capture_names: list[str] = []
for flow in flows.values():
    text = flow.read_text(encoding="utf-8")
    capture_names.extend(re.findall(r"""takeScreenshot:\s*[\'"]([^\'"]+)[\'"]""", text))

capture_counts = Counter(capture_names)
missing_captures = sorted(expected_mobile_captures - set(capture_names))
unexpected_captures = sorted(set(capture_names) - expected_mobile_captures)
duplicated_captures = sorted(name for name, count in capture_counts.items() if count != 1)
if missing_captures:
    errors.append("Missing approved mobile media captures: " + ", ".join(missing_captures))
if unexpected_captures:
    errors.append("Unexpected mobile media captures: " + ", ".join(unexpected_captures))
if duplicated_captures:
    errors.append("Mobile media captures must appear exactly once: " + ", ".join(duplicated_captures))

if errors:
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    raise SystemExit(1)

print(f"Maestro workflow suite validation passed ({len(flows)} flows).")
