import * as SecureStore from 'expo-secure-store';
import type { RepairRole } from '@repairflow/contracts';

const roleKey = 'repairflow.preview.role';

export async function getPreviewRole(): Promise<RepairRole> {
  const value = await SecureStore.getItemAsync(roleKey);
  if (value === 'intake' || value === 'technician' || value === 'quality') return value;
  return 'technician';
}

export async function setPreviewRole(role: RepairRole): Promise<void> {
  await SecureStore.setItemAsync(roleKey, role);
}
