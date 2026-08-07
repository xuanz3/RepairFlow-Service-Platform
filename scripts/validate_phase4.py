#!/usr/bin/env python3
from pathlib import Path
import json, os, re
import subprocess
root=Path(__file__).resolve().parents[1]
required=['apps/desktop/vitest.config.ts','scripts/validate_maestro_flows.py','tools/release/prepare-desktop-package.mjs','tools/verify/desktop-package-contract.mjs','tools/release/verify-mobile-native-contract.py','tools/release/build-metadata.mjs','tools/release/generate-checksums.mjs','tools/release/generate-sbom.mjs','tools/release/finalise-readme.mjs','tools/verify/release-bundle-contract.mjs','tools/media/capture-manifest.json','tools/media/compose-final-media.mjs','tools/media/insert-readme-media.mjs','apps/desktop/playwright.a11y.config.ts','apps/desktop/tests/a11y/workshop.a11y.spec.ts','apps/desktop/tests/media/product-media.e2e.ts','apps/mobile/maestro/release-smoke.yaml','apps/mobile/maestro/release-media-android.yaml','apps/mobile/maestro/release-media-ios.yaml','.github/workflows/phase4-release-candidate.yml']
missing=[x for x in required if not (root/x).is_file()]; assert not missing, f'Missing Phase 4 files: {missing}'
for rel in ['package.json','apps/desktop/package.json','apps/mobile/package.json']:
 data=json.loads((root/rel).read_text()); assert data['version']=='1.0.0', f'{rel} must be version 1.0.0'
app=json.loads((root/'apps/mobile/app.json').read_text())['expo']; assert app['version']=='1.0.0'
manifest=json.loads((root/'tools/media/capture-manifest.json').read_text()); names=[x['file'] for x in manifest['items']]
assert len(names)==18 and len(set(names))==18 and sum(bool(x['primary']) for x in manifest['items'])==6
final=root/'docs/evidence/final'; images=sorted(p.name for p in final.glob('*.png')) if final.exists() else []
strict=os.getenv('REPAIRFLOW_REQUIRE_FINAL_MEDIA')=='1'
assert len(images) in ({18} if strict else {0,18}), f'Expected {"exactly 18" if strict else "zero or 18"} final images, found {len(images)}'
if images:
 assert images==sorted(names), 'Final media names differ from approved manifest'
 readme=(root/'README.md').read_text()
 for name in names: assert readme.count(f'docs/evidence/final/{name}')==1, f'README reference missing or duplicated: {name}'
 assert 'Product media will be inserted' not in readme
 if strict:
  assert '> Current version: **v1.0.0**' in readme
  assert re.search(r'^\| Phase 4 \|.*\| Complete \|$', readme, flags=re.MULTILINE), 'README Phase 4 status must be Complete'
  from struct import unpack
  for name in names:
   data=(final/name).read_bytes(); assert data[:8]==b'\x89PNG\r\n\x1a\n', f'{name} is not PNG'; width,height=unpack('>II',data[16:24]); assert (width,height)==(1600,900), f'{name} dimensions are {width}x{height}'
readme=(root/'README.md').read_text(); assert re.search(r'^\| Phase 3 \| Offline synchronisation, reliability, security and observability \| Complete\s*\|$', readme, flags=re.MULTILINE), 'README must retain Phase 3 as Complete'
workspace_policy=(root/'pnpm-workspace.yaml').read_text()
for token in ['  electron-winstaller: true', '  sharp: true']:
 assert token in workspace_policy, f'pnpm lifecycle allowlist missing reviewed entry: {token.strip()}'
maestro_validator=(root/'scripts/validate_maestro_flows.py').read_text()
for token in ['intake-and-diagnosis.yaml','release-smoke.yaml','release-media-android.yaml','release-media-ios.yaml','expected_mobile_captures']:
 assert token in maestro_validator, f'Maestro suite validator missing {token}'
vitest_config=(root/'apps/desktop/vitest.config.ts').read_text()
for token in ["include: ['src/**/*.test.{ts,tsx}']", "'tests/**'"]:
 assert token in vitest_config, f'Desktop Vitest boundary missing {token}'
for forbidden in ["tests/a11y", "tests/e2e", "tests/media"]:
 assert forbidden not in vitest_config.replace("'tests/**'", ""), f'Vitest must not collect Playwright suite: {forbidden}'

vite_config=(root/'apps/desktop/vite.config.ts').read_text()
assert "base: './'" in vite_config, 'Desktop Vite production build must use relative asset URLs for Electron file loading'
media_test=(root/'apps/desktop/tests/media/product-media.e2e.ts').read_text()
for token in ["getByTestId('new-intake')", "process.platform === 'linux' && process.env.CI", "['--no-sandbox', '.']"]:
 assert token in media_test, f'Desktop Electron media capture missing production readiness token: {token}'
package_contract=(root/'tools/verify/desktop-package-contract.mjs').read_text()
assert 'Production Electron renderer must use relative Vite asset URLs.' in package_contract, 'Desktop package contract must verify file-safe renderer assets'
assert '=\\"\/assets' not in package_contract, 'Desktop package contract regex must not contain a useless escaped quote'

media_config=(root/'apps/desktop/playwright.media.config.ts').read_text()
assert "testDir: './tests/media'" in media_config, 'Desktop media Playwright config must target tests/media'
assert "testMatch: '**/*.e2e.ts'" in media_config, 'Desktop media Playwright config must collect the .e2e.ts capture suite'

workflow=(root/'.github/workflows/phase4-release-candidate.yml').read_text()
assert 'head -n 1' not in workflow, 'Phase 4 workflow must not use early-exit head pipelines under GitHub Actions pipefail'
assert workflow.count('electron --no-sandbox .release-package') == 2, 'Linux CI runtime smoke must use --no-sandbox exactly twice'
assert 'ELECTRON_DISABLE_SANDBOX' not in workflow, 'Phase 4 workflow must not disable Electron sandbox globally'

for token in ['desktop-package','android-package','ios-package','desktop-media','aggregate-release']:
 assert token in workflow, f'Phase 4 workflow missing {token}'
release_helpers=['tools/release/prepare-desktop-package.mjs','tools/release/verify-mobile-native-contract.py','tools/release/build-metadata.mjs','tools/release/generate-checksums.mjs','tools/release/generate-sbom.mjs','tools/release/finalise-readme.mjs']
ignore_text=(root/'.gitignore').read_text()
for token in ['!tools/release/','!tools/release/**']:
 assert token in ignore_text.splitlines(), f'.gitignore must explicitly retain release helper source: {token}'
tracked=set(subprocess.check_output(['git','ls-files'], cwd=root, text=True).splitlines())
for rel in release_helpers:
 assert rel in tracked, f'Phase 4 release helper must be tracked by Git: {rel}'

sbom_source=(root/'tools/release/generate-sbom.mjs').read_text()
assert "/^ {2}['\"]?" in sbom_source, 'SBOM lockfile parser must use an explicit {2} indentation quantifier'
assert "/^  ['\"]?" not in sbom_source, 'SBOM lockfile parser must not use hard-to-count repeated regex spaces'

print('Phase 4 release and media validation passed.')
