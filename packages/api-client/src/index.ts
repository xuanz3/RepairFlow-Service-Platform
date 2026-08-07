import type {
  CompleteRepairActionRequest,
  CreateEvidenceRequest,
  CreateRepairActionRequest,
  CreateRepairCaseRequest,
  HealthResponse,
  RecordDiagnosisRequest,
  RepairCaseDetail,
  RepairCaseSummary,
  SubmitQualityReviewRequest,
  UpdateRepairStatusRequest,
} from '@repairflow/contracts';

export interface RepairFlowClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | undefined>;
  fetchImpl?: typeof fetch;
}

export class RepairFlowClient {
  private readonly fetchImpl: typeof fetch;

  public constructor(private readonly options: RepairFlowClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public getHealth(signal?: AbortSignal): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health/live', { signal });
  }

  public listRepairCases(signal?: AbortSignal): Promise<RepairCaseSummary[]> {
    return this.request<RepairCaseSummary[]>('/api/repair-cases', { signal });
  }

  public getRepairCase(id: string, signal?: AbortSignal): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>(`/api/repair-cases/${id}`, { signal });
  }

  public createRepairCase(
    input: CreateRepairCaseRequest,
    signal?: AbortSignal,
  ): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>('/api/repair-cases', {
      method: 'POST',
      body: JSON.stringify(input),
      signal,
    });
  }

  public recordDiagnosis(
    id: string,
    input: RecordDiagnosisRequest,
    signal?: AbortSignal,
  ): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>(`/api/repair-cases/${id}/diagnosis`, {
      method: 'POST',
      body: JSON.stringify(input),
      signal,
    });
  }

  public createRepairAction(
    id: string,
    input: CreateRepairActionRequest,
    signal?: AbortSignal,
  ): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>(`/api/repair-cases/${id}/repair-actions`, {
      method: 'POST',
      body: JSON.stringify(input),
      signal,
    });
  }

  public completeRepairAction(
    caseId: string,
    actionId: string,
    input: CompleteRepairActionRequest,
    signal?: AbortSignal,
  ): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>(
      `/api/repair-cases/${caseId}/repair-actions/${actionId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        signal,
      },
    );
  }

  public addEvidence(
    id: string,
    input: CreateEvidenceRequest,
    signal?: AbortSignal,
  ): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>(`/api/repair-cases/${id}/evidence`, {
      method: 'POST',
      body: JSON.stringify(input),
      signal,
    });
  }

  public submitQualityReview(
    id: string,
    input: SubmitQualityReviewRequest,
    signal?: AbortSignal,
  ): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>(`/api/repair-cases/${id}/quality-reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
      signal,
    });
  }

  public transitionRepairCase(
    id: string,
    input: UpdateRepairStatusRequest,
    signal?: AbortSignal,
  ): Promise<RepairCaseDetail> {
    return this.request<RepairCaseDetail>(`/api/repair-cases/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(input),
      signal,
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      const problem = await response.text();
      throw new Error(
        `RepairFlow service request failed with status ${response.status}${problem ? `: ${problem}` : '.'}`,
      );
    }

    return (await response.json()) as T;
  }
}
