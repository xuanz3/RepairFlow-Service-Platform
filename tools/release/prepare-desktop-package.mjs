import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const desktop=resolve(root,'apps/desktop');
const stage=resolve(desktop,'.release-package');
rmSync(stage,{recursive:true,force:true}); mkdirSync(stage,{recursive:true});
for (const name of ['dist','dist-electron']) cpSync(resolve(desktop,name),resolve(stage,name),{recursive:true});
writeFileSync(resolve(stage,'package.json'), JSON.stringify({name:'repairflow-desktop-runtime',version:'1.0.0',private:true,type:'module',main:'dist-electron/main.js'},null,2)+'\n');
writeFileSync(resolve(stage,'electron-builder.json'), JSON.stringify({
  appId:'com.xuanz3.repairflow.desktop', productName:'RepairFlow', asar:true, npmRebuild:false, electronVersion:'43.2.0',
  directories:{output:'../release/desktop'}, files:['dist/**/*','dist-electron/**/*','package.json'],
  mac:{category:'public.app-category.utilities',target:['zip']}, win:{target:['portable']}, linux:{target:['AppImage'],category:'Utility'}
},null,2)+'\n');
console.log(`Desktop release stage prepared at ${stage}`);
