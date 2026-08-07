import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import type { EvidenceKind, EvidenceMetadata } from '@repairflow/contracts';

export async function preserveEvidencePhoto(
  repairCaseId: string,
  photoUri: string,
  kind: EvidenceKind,
  note?: string,
): Promise<EvidenceMetadata> {
  const directory = new Directory(Paths.document, 'repairflow', 'evidence', repairCaseId);
  directory.create({ idempotent: true, intermediates: true });

  const source = new File(photoUri);
  const extension = extensionFor(source.type || photoUri);
  const destination = new File(directory, `${Crypto.randomUUID()}${extension}`);
  source.copy(destination);

  const bytes = await destination.bytes();
  const digest = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));
  const sha256 = Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');

  return {
    id: Crypto.randomUUID(),
    fileName: destination.uri.split('/').at(-1) ?? `evidence${extension}`,
    contentType: destination.type || contentTypeFor(extension),
    sizeBytes: destination.size,
    sha256,
    localUri: destination.uri,
    kind,
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
}

function extensionFor(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('png') || lower.endsWith('.png')) return '.png';
  if (lower.includes('webp') || lower.endsWith('.webp')) return '.webp';
  return '.jpg';
}

function contentTypeFor(extension: string): string {
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}
