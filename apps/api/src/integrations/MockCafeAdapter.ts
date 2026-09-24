import type { PcStatus } from "@pc-booking/shared";
import type {
  AdapterCredentials,
  CafeIntegrationAdapter,
  ExternalPc,
  SyncResult,
} from "./types.js";

const MOCK_PCS: ExternalPc[] = [
  {
    externalId: "mock-1",
    name: "PC-01",
    zone: "Main",
    status: "AVAILABLE",
    specifications: { cpu: "Ryzen 5", gpu: "RTX 3060", ram: 16 },
  },
  {
    externalId: "mock-2",
    name: "PC-02",
    zone: "Main",
    status: "IN_USE",
    specifications: { cpu: "Ryzen 5", gpu: "RTX 3060", ram: 16 },
  },
  {
    externalId: "mock-3",
    name: "PC-03",
    zone: "VIP",
    status: "RESERVED",
    specifications: { cpu: "Ryzen 7", gpu: "RTX 4070", ram: 32 },
  },
  {
    externalId: "mock-4",
    name: "PC-04",
    zone: "VIP",
    status: "OFFLINE",
    specifications: { cpu: "Ryzen 7", gpu: "RTX 4070", ram: 32 },
  },
];

export class MockCafeAdapter implements CafeIntegrationAdapter {
  readonly provider = "MOCK";

  async validateCredentials(_credentials: AdapterCredentials): Promise<boolean> {
    return true;
  }

  async syncCafe(_credentials: AdapterCredentials): Promise<SyncResult> {
    return {
      pcs: MOCK_PCS,
      cafeExternalId: "mock-cafe",
      syncedAt: new Date(),
    };
  }

  async syncPcs(_credentials: AdapterCredentials): Promise<ExternalPc[]> {
    return MOCK_PCS;
  }

  async getPcStatuses(
    _credentials: AdapterCredentials,
  ): Promise<Array<{ externalId: string; status: PcStatus }>> {
    return MOCK_PCS.map((pc) => ({
      externalId: pc.externalId,
      status: pc.status,
    }));
  }
}
