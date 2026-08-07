import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..'); const readme=resolve(root,'README.md'); const manifest=JSON.parse(readFileSync(resolve(root,'tools/media/capture-manifest.json'),'utf8'));
const start='<!-- product-media:start -->', end='<!-- product-media:end -->'; let text=readFileSync(readme,'utf8');
if(text.split(start).length!==2 || text.split(end).length!==2) throw new Error('README media markers are invalid.');
const primary=manifest.items.filter((x)=>x.primary); const secondary=manifest.items.filter((x)=>!x.primary);
const image=(x)=>`![${x.title}](docs/evidence/final/${x.file})`;
const block=[start,'','## Product views','',primary.map(image).join('\n\n'),'','<details>','<summary>More verified product and release evidence</summary>','',secondary.map(image).join('\n\n'),'','</details>','',end].join('\n');
text=text.slice(0,text.indexOf(start))+block+text.slice(text.indexOf(end)+end.length); writeFileSync(readme,text); console.log('README product media block updated from the approved manifest.');
