import { z } from 'zod';
import { repairCaseStatuses, repairPriorities } from '@repairflow/contracts';

export const createRepairCaseSchema = z.object({
  customerDisplayName: z.string().trim().min(2).max(120),
  manufacturer: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  serialNumber: z.string().trim().min(3).max(160),
  reportedFault: z.string().trim().min(5).max(2000),
  priority: z.enum(repairPriorities),
});

export const updateRepairStatusSchema = z.object({
  status: z.enum(repairCaseStatuses),
  expectedVersion: z.number().int().positive(),
  note: z.string().trim().max(1000).optional(),
});

export type CreateRepairCaseInput = z.infer<typeof createRepairCaseSchema>;
export type UpdateRepairStatusInput = z.infer<typeof updateRepairStatusSchema>;
