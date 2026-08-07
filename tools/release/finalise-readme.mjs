import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const p = resolve(import.meta.dirname, '../../README.md');
let s = readFileSync(p, 'utf8');
s = s.replace(
  '> Current stage: **Phase 4 - Packaging, Product Media and v1.0**',
  '> Current version: **v1.0.0**',
);
s = s.replace(
  /^\| Phase 4 \|.*$/m,
  '| Phase 4 | Packaging, automated product media and the v1.0 release | Complete |',
);
writeFileSync(p, s);
console.log('README v1 release status finalised.');
