import type { UploadSessionInfo } from '@repairflow/contracts';

export interface UploadChunk {
  offset: number;
  length: number;
  endExclusive: number;
}

export interface UploadPlan {
  totalBytes: number;
  chunkSize: number;
  chunks: UploadChunk[];
}

export function createUploadPlan(totalBytes: number, chunkSize = 256 * 1024): UploadPlan {
  if (!Number.isSafeInteger(totalBytes) || totalBytes <= 0) {
    throw new RangeError('Upload size must be a positive safe integer.');
  }
  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0 || chunkSize > 1024 * 1024) {
    throw new RangeError('Chunk size must be between 1 byte and 1 MiB.');
  }

  const chunks: UploadChunk[] = [];
  for (let offset = 0; offset < totalBytes; offset += chunkSize) {
    const length = Math.min(chunkSize, totalBytes - offset);
    chunks.push({ offset, length, endExclusive: offset + length });
  }
  return { totalBytes, chunkSize, chunks };
}

export function nextUploadChunk(plan: UploadPlan, receivedBytes: number): UploadChunk | undefined {
  if (
    !Number.isSafeInteger(receivedBytes) ||
    receivedBytes < 0 ||
    receivedBytes > plan.totalBytes
  ) {
    throw new RangeError('Received byte count is outside the upload plan.');
  }
  if (receivedBytes === plan.totalBytes) return undefined;
  const length = Math.min(plan.chunkSize, plan.totalBytes - receivedBytes);
  return { offset: receivedBytes, length, endExclusive: receivedBytes + length };
}

export interface ResumableUploadTransport {
  uploadChunk(sessionId: string, offset: number, chunk: Uint8Array): Promise<UploadSessionInfo>;
  completeUpload(sessionId: string): Promise<UploadSessionInfo>;
}

export async function resumeUpload(
  initialSession: UploadSessionInfo,
  readChunk: (offset: number, length: number) => Promise<Uint8Array>,
  transport: ResumableUploadTransport,
): Promise<UploadSessionInfo> {
  if (initialSession.state === 'completed') return initialSession;
  if (initialSession.state !== 'active') throw new Error('Upload session is not active.');

  const plan = createUploadPlan(initialSession.totalBytes, initialSession.chunkSize);
  let session = initialSession;
  while (session.receivedBytes < session.totalBytes) {
    const chunkPlan = nextUploadChunk(plan, session.receivedBytes);
    if (!chunkPlan) break;
    const bytes = await readChunk(chunkPlan.offset, chunkPlan.length);
    if (bytes.byteLength !== chunkPlan.length) {
      throw new Error('Evidence source returned an unexpected chunk length.');
    }
    const updated = await transport.uploadChunk(session.sessionId, chunkPlan.offset, bytes);
    if (updated.receivedBytes !== chunkPlan.endExclusive) {
      throw new Error('Server committed an unexpected upload offset.');
    }
    session = updated;
  }

  if (session.receivedBytes !== session.totalBytes) {
    throw new Error('Upload stopped before every byte was committed.');
  }
  return transport.completeUpload(session.sessionId);
}
