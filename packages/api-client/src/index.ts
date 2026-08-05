import type { HealthResponse, RepairCaseSummary } from '@repairflow/contracts';

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

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`RepairFlow service request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
  }
}
