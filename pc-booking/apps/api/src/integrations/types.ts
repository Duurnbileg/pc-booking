import type { PcStatus } from "@pc-booking/shared";

export type ExternalPc = {
  externalId: string;
  name: string;
  zone?: string;
  status: PcStatus;
  specifications?: {
    cpu?: string;
    gpu?: string;
    ram?: number;
  };
  pricePerHour?: number;
};

export type SyncResult = {
  pcs: ExternalPc[];
  cafeExternalId?: string;
  syncedAt: Date;
};

export type AdapterCredentials = {
  apiKey: string;
  cafeExternalId?: string;
};

/**
 * Provider-independent cafe integration adapter.
 * Real iCafeCloud calls come in Phase 2.
 */
export interface CafeIntegrationAdapter {
  readonly provider: string;
  validateCredentials(credentials: AdapterCredentials): Promise<boolean>;
  syncCafe(credentials: AdapterCredentials): Promise<SyncResult>;
  syncPcs(credentials: AdapterCredentials): Promise<ExternalPc[]>;
  getPcStatuses(
    credentials: AdapterCredentials,
  ): Promise<Array<{ externalId: string; status: PcStatus }>>;
}
