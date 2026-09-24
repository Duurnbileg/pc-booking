import type { PcStatus } from "@pc-booking/shared";
import type {
  AdapterCredentials,
  CafeIntegrationAdapter,
  ExternalPc,
  SyncResult,
} from "./types.js";

/**
 * Stub for Phase 2 iCafeCloud HTTP integration.
 * Methods throw until real API wiring is implemented.
 */
export class ICafeCloudAdapter implements CafeIntegrationAdapter {
  readonly provider = "ICAFE_CLOUD";

  async validateCredentials(_credentials: AdapterCredentials): Promise<boolean> {
    throw new Error("ICafeCloudAdapter.validateCredentials is not implemented (Phase 2)");
  }

  async syncCafe(_credentials: AdapterCredentials): Promise<SyncResult> {
    throw new Error("ICafeCloudAdapter.syncCafe is not implemented (Phase 2)");
  }

  async syncPcs(_credentials: AdapterCredentials): Promise<ExternalPc[]> {
    throw new Error("ICafeCloudAdapter.syncPcs is not implemented (Phase 2)");
  }

  async getPcStatuses(
    _credentials: AdapterCredentials,
  ): Promise<Array<{ externalId: string; status: PcStatus }>> {
    throw new Error("ICafeCloudAdapter.getPcStatuses is not implemented (Phase 2)");
  }
}
