import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const out=resolve(process.argv[2] ?? 'artifacts/release-bundle'); mkdirSync(out,{recursive:true});
const metadata={
  schemaVersion:1, product:'RepairFlow', version:'1.0.0',
  commit:process.env.GITHUB_SHA ?? process.env.REPAIRFLOW_COMMIT ?? 'local',
  workflowRun:process.env.GITHUB_RUN_ID ?? null,
  generatedAt:process.env.REPAIRFLOW_BUILD_TIME ?? new Date().toISOString(),
  node:process.version,
  platforms:['macOS-arm64','Windows-x64','Linux-x64','Android','iOS-Simulator'],
};
writeFileSync(resolve(out,'build-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
console.log('Build metadata generated.');
