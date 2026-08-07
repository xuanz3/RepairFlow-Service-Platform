import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
for (const path of ['apps/desktop/dist/index.html','apps/desktop/dist-electron/main.js','apps/desktop/dist-electron/preload.cjs']) {
  if (!existsSync(resolve(root,path))) throw new Error(`Missing desktop package input: ${path}`);
}
const manifest=JSON.parse(readFileSync(resolve(root,'apps/desktop/.release-package/package.json'),'utf8'));
if (manifest.version!=='1.0.0' || manifest.main!=='dist-electron/main.js') throw new Error('Desktop staged runtime manifest is invalid.');
console.log('Desktop package contract passed.');
