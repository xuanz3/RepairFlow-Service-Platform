import { z } from 'zod';
import {
  evidenceKinds,
  qualityOutcomes,
  repairActionStatuses,
  repairCaseStatuses,
  repairPriorities,
} from '@repairflow/contracts';

export const createRepairCaseSchema = z.object({
  customerDisplayName: z.string().trim().min(2).max(120),
  manufacturer: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  serialNumber: z.string().trim().min(3).max(160),
  reportedFault: z.string().trim().min(5).max(2000),
  intakeCondition: z.string().trim().min(3).max(2000),
  priority: z.enum(repairPriorities),
});

export const recordDiagnosisSchema = z.object({
  summary: z.string().trim().min(5).max(4000),
  recommendation: z.string().trim().min(3).max(2000),
  diagnosticCode: z.string().trim().max(80).optional(),
  expectedVersion: z.number().int().positive(),
});

export const createRepairActionSchema = z.object({
  title: z.string().trim().min(2).max(160),
  detail: z.string().trim().min(3).max(2000),
  partNumber: z.string().trim().max(120).optional(),
  expectedVersion: z.number().int().positive(),
});

export const completeRepairActionSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

export const createEvidenceSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(3).max(120),
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string().trim().length(64).optional(),
  kind: z.enum(evidenceKinds),
  note: z.string().trim().max(1000).optional(),
  expectedVersion: z.number().int().positive(),
});

export const submitQualityReviewSchema = z.object({
  outcome: z.enum(qualityOutcomes),
  notes: z.string().trim().min(3).max(2000),
  evidenceComplete: z.boolean(),
  expectedVersion: z.number().int().positive(),
});

export const updateRepairStatusSchema = z.object({
  status: z.enum(repairCaseStatuses),
  expectedVersion: z.number().int().positive(),
  note: z.string().trim().max(1000).optional(),
});

export const repairActionStatusSchema = z.enum(repairActionStatuses);

export type CreateRepairCaseInput = z.infer<typeof createRepairCaseSchema>;
export type RecordDiagnosisInput = z.infer<typeof recordDiagnosisSchema>;
export type CreateRepairActionInput = z.infer<typeof createRepairActionSchema>;
export type CompleteRepairActionInput = z.infer<typeof completeRepairActionSchema>;
export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type SubmitQualityReviewInput = z.infer<typeof submitQualityReviewSchema>;
export type UpdateRepairStatusInput = z.infer<typeof updateRepairStatusSchema>;
