import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
const dir=resolve(process.argv[2] ?? 'artifacts/release-bundle');
const files=readdirSync(dir).map((n)=>join(dir,n)).filter((p)=>statSync(p).isFile() && basename(p)!=='SHA256SUMS').sort();
const lines=files.map((p)=>`${createHash('sha256').update(readFileSync(p)).digest('hex')}  ${basename(p)}`);
writeFileSync(join(dir,'SHA256SUMS'),lines.join('\n')+'\n');
console.log(`Generated checksums for ${files.length} release files.`);
