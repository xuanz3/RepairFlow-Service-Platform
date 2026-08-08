import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const out = resolve(process.argv[2] ?? 'artifacts/release-bundle');
mkdirSync(out, { recursive: true });
const components = new Map();
function add(type, name, version, purl) {
  if (!name || !version) return;
  const key = `${type}:${name}@${version}`;
  components.set(key, { type, name, version, 'bom-ref': key, purl });
}
const lock = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
let inSnapshots = false;
for (const line of lock.split(/\r?\n/)) {
  if (line === 'snapshots:') {
    inSnapshots = true;
    continue;
  }
  if (inSnapshots && /^[A-Za-z]/.test(line)) break;
  if (!inSnapshots) continue;
  const m = line.match(/^ {2}['"]?(.+?)['"]?:\s*$/);
  if (!m) continue;
  let raw = m[1];
  const paren = raw.indexOf('(');
  if (paren >= 0) raw = raw.slice(0, paren);
  const at = raw.lastIndexOf('@');
  if (at <= 0) continue;
  const name = raw.slice(0, at);
  const version = raw.slice(at + 1);
  if (/^\d/.test(version))
    add(
      'library',
      name,
      version,
      `pkg:npm/${encodeURIComponent(name).replace('%40', '@')}@${version}`,
    );
}
for (const rel of [
  'apps/api/src/RepairFlow.Api/packages.lock.json',
  'apps/api/src/RepairFlow.Application/packages.lock.json',
  'apps/api/src/RepairFlow.Domain/packages.lock.json',
  'apps/api/src/RepairFlow.Infrastructure/packages.lock.json',
]) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const data = JSON.parse(readFileSync(p, 'utf8'));
  for (const deps of Object.values(data.dependencies ?? {}))
    for (const [name, info] of Object.entries(deps))
      add(
        'library',
        name,
        info.resolved ?? info.requested,
        `pkg:nuget/${name}@${info.resolved ?? info.requested}`,
      );
}
const serial = createHash('sha256')
  .update(process.env.GITHUB_SHA ?? 'repairflow-v1')
  .digest('hex')
  .slice(0, 32);
const bom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: `urn:uuid:${serial.slice(0, 8)}-${serial.slice(8, 12)}-${serial.slice(12, 16)}-${serial.slice(16, 20)}-${serial.slice(20, 32)}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: { type: 'application', name: 'RepairFlow', version: '1.0.0' },
  },
  components: [...components.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  ),
};
writeFileSync(join(out, 'repairflow-sbom.cdx.json'), JSON.stringify(bom, null, 2) + '\n');
console.log(`CycloneDX SBOM generated with ${bom.components.length} components.`);
