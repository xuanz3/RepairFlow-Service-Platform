import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import type {
  DeltaPage,
  EvidenceMetadata,
  RepairCaseDetail,
  SyncOperationEnvelope,
} from '@repairflow/contracts';
import type { OutboxItem } from '@repairflow/sync-engine';
import { DurableSyncStore } from './syncStore.js';
import { LocalWorkflowStore } from './workflowStore.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
let store: LocalWorkflowStore | undefined;
let syncStore: DurableSyncStore | undefined;

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#0f141c',
    title: 'RepairFlow Workshop',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(currentDirectory, 'preload.cjs'),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(path.join(currentDirectory, '../dist/index.html'));
  }
}

function registerWorkflowIpc(workflowStore: LocalWorkflowStore): void {
  ipcMain.handle('workflow:list', () => workflowStore.list());
  ipcMain.handle('workflow:get', (_event, id: string) => workflowStore.get(id));
  ipcMain.handle('workflow:save', (_event, repairCase: RepairCaseDetail) =>
    workflowStore.save(repairCase),
  );
  ipcMain.handle('workflow:reset', () => workflowStore.reset());
  ipcMain.handle('workflow:select-evidence', async (): Promise<EvidenceMetadata | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Attach repair evidence',
      properties: ['openFile'],
      filters: [
        { name: 'Supported evidence', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'txt'] },
      ],
    });

    const sourcePath = result.filePaths[0];
    if (result.canceled || !sourcePath) return null;

    const evidenceDirectory = path.join(app.getPath('userData'), 'evidence');
    mkdirSync(evidenceDirectory, { recursive: true });
    const extension = path.extname(sourcePath).toLowerCase();
    const fileName = `${randomUUID()}${extension}`;
    const destinationPath = path.join(evidenceDirectory, fileName);
    copyFileSync(sourcePath, destinationPath);

    const bytes = readFileSync(destinationPath);
    const digest = createHash('sha256').update(bytes).digest('hex');
    const contentType = mimeTypeFor(extension);

    return {
      id: randomUUID(),
      fileName: path.basename(sourcePath),
      contentType,
      sizeBytes: statSync(destinationPath).size,
      sha256: digest,
      localUri: destinationPath,
      kind: 'repair',
      createdAt: new Date().toISOString(),
    };
  });
}

function registerSyncIpc(reliabilityStore: DurableSyncStore): void {
  ipcMain.handle('workflow:delete', (_event, id: string) => store?.delete(id) ?? false);
  ipcMain.handle('sync:queue', (_event, operation: SyncOperationEnvelope) =>
    reliabilityStore.queue(operation),
  );
  ipcMain.handle('sync:list-ready', (_event, now: string, limit: number) =>
    reliabilityStore.listReadySync(now, limit),
  );
  ipcMain.handle('sync:save', (_event, item: OutboxItem) => reliabilityStore.saveSync(item));
  ipcMain.handle('sync:get-cursor', () => reliabilityStore.getCursor());
  ipcMain.handle('sync:set-cursor', (_event, cursor: number) => reliabilityStore.setCursor(cursor));
  ipcMain.handle('sync:record-delta', (_event, page: DeltaPage) =>
    reliabilityStore.recordDelta(page),
  );
  ipcMain.handle('sync:summary', () => reliabilityStore.summary());
}

function mimeTypeFor(extension: string): string {
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'text/plain';
  }
}

app.whenReady().then(() => {
  store = new LocalWorkflowStore(path.join(app.getPath('userData'), 'repairflow-workflows.sqlite'));
  syncStore = new DurableSyncStore(path.join(app.getPath('userData'), 'repairflow-sync.sqlite'));
  registerWorkflowIpc(store);
  registerSyncIpc(syncStore);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  store?.close();
  syncStore?.close();
  store = undefined;
  syncStore = undefined;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
