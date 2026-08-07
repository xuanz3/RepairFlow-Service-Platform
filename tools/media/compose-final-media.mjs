import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const raw=resolve(process.argv[2] ?? 'artifacts/media/raw'); const out=resolve(process.argv[3] ?? 'artifacts/media/final');
const manifest=JSON.parse(readFileSync(join(root,'tools/media/capture-manifest.json'),'utf8')); rmSync(out,{recursive:true,force:true}); mkdirSync(out,{recursive:true});
const W=1600,H=900;
const esc=(s)=>s.replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function cardSvg(title,subtitle='RepairFlow · verified release evidence') { return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0f141c"/><text x="70" y="78" fill="#aeb8ff" font-size="18" font-family="Arial" font-weight="700">REPAIRFLOW</text><text x="70" y="125" fill="#fff" font-size="34" font-family="Arial" font-weight="700">${esc(title)}</text><text x="70" y="160" fill="#a7b0bf" font-size="16" font-family="Arial">${esc(subtitle)}</text></svg>`); }
async function frame(source,dest,title,{fit='contain',left=70,top=200,width=1460,height=630}={}) { if(!existsSync(source)) throw new Error(`Missing media source: ${source}`); const image=await sharp(source).resize(width,height,{fit,background:'#121923'}).png().toBuffer(); await sharp(cardSvg(title)).composite([{input:image,left,top}]).png().toFile(dest); }
const byName=(name)=>manifest.items.find((i)=>i.file===name);
for(const item of manifest.items.filter((i)=>/^0[2-7]-/.test(i.file))){ await frame(join(raw,'desktop',item.file),join(out,item.file),item.title,{fit:'cover'}); }
for(const item of manifest.items.filter((i)=>/^0[8-9]-|^1[0-3]-/.test(i.file))){ const source=join(raw,'ios',item.file); await frame(source,join(out,item.file),item.title,{left:525,top:190,width:550,height:650}); }
await frame(join(raw,'android','14-mobile-offline-queue.png'),join(out,'14-mobile-offline-queue.png'),byName('14-mobile-offline-queue.png').title,{left:525,top:190,width:550,height:650});
for(const item of manifest.items.filter((i)=>/^1[5-6]-/.test(i.file))){ await frame(join(raw,'diagrams',item.file),join(out,item.file),item.title,{left:120,top:200,width:1360,height:620}); }
// Hero combines real desktop and mobile captures.
const desk=await sharp(join(raw,'desktop','02-desktop-workshop-dashboard.png')).resize(1000,620,{fit:'cover'}).png().toBuffer();
const mobile=await sharp(join(raw,'ios','08-mobile-work-queue.png')).resize(360,620,{fit:'contain',background:'#121923'}).png().toBuffer();
await sharp(cardSvg('Cross-platform repair operations','Desktop workshop control with offline-capable mobile intake')).composite([{input:desk,left:70,top:205},{input:mobile,left:1140,top:205}]).png().toFile(join(out,'01-cross-platform-hero.png'));
async function generated(name,title,lines){ const body=lines.map((line,i)=>`<text x="120" y="${260+i*72}" fill="${i%2?'#aeb8ff':'#ffffff'}" font-size="${i%2?22:28}" font-family="Arial" font-weight="${i%2?500:700}">${esc(line)}</text>`).join(''); const svg=Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0f141c"/><text x="70" y="78" fill="#aeb8ff" font-size="18" font-family="Arial" font-weight="700">REPAIRFLOW</text><text x="70" y="125" fill="#fff" font-size="34" font-family="Arial" font-weight="700">${esc(title)}</text>${body}</svg>`); await sharp(svg).png().toFile(join(out,name)); }
await generated('17-test-observability-summary.png',byName('17-test-observability-summary.png').title,['TypeScript + Vitest + Playwright + Maestro','xUnit · security boundaries · recovery scenarios','OpenTelemetry · Prometheus · Grafana','Cross-platform release gates']);
await generated('18-release-artifact-matrix.png',byName('18-release-artifact-matrix.png').title,['macOS arm64 · signed-ready ZIP','Windows x64 · portable executable','Linux x64 · AppImage','Android APK · iOS Simulator app','SHA-256 checksums · CycloneDX SBOM']);
const files=manifest.items.map((i)=>i.file); for(const file of files) if(!existsSync(join(out,file))) throw new Error(`Final media missing: ${file}`);
console.log(`Composed ${files.length} approved RepairFlow images.`);
