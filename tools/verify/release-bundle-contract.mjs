import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
const dir = resolve(process.argv[2] ?? 'artifacts/release-bundle');
for (const name of ['build-metadata.json', 'repairflow-sbom.cdx.json', 'SHA256SUMS'])
  if (!existsSync(join(dir, name))) throw new Error(`Release integrity file missing: ${name}`);
const metadata = JSON.parse(readFileSync(join(dir, 'build-metadata.json'), 'utf8'));
if (metadata.product !== 'RepairFlow' || metadata.version !== '1.0.0')
  throw new Error('Build metadata identity mismatch.');
const bom = JSON.parse(readFileSync(join(dir, 'repairflow-sbom.cdx.json'), 'utf8'));
if (
  bom.bomFormat !== 'CycloneDX' ||
  bom.specVersion !== '1.6' ||
  !Array.isArray(bom.components) ||
  bom.components.length < 20
)
  throw new Error('CycloneDX SBOM is incomplete.');
const expected = new Map(
  readFileSync(join(dir, 'SHA256SUMS'), 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([a-f0-9]{64})  (.+)$/);
      if (!m) throw new Error(`Invalid checksum line: ${line}`);
      return [m[2], m[1]];
    }),
);
for (const path of readdirSync(dir)
  .map((n) => join(dir, n))
  .filter((p) => statSync(p).isFile() && basename(p) !== 'SHA256SUMS')) {
  const name = basename(path);
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (expected.get(name) !== actual) throw new Error(`Checksum mismatch: ${name}`);
  expected.delete(name);
}
if (expected.size)
  throw new Error(`Checksums reference unexpected files: ${[...expected.keys()].join(', ')}`);
console.log(`Release bundle contract passed with ${bom.components.length} SBOM components.`);
