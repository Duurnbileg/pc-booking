import { MockCafeAdapter } from "./MockCafeAdapter.js";
import { ICafeCloudAdapter } from "./ICafeCloudAdapter.js";
import type { CafeIntegrationAdapter } from "./types.js";

export type IntegrationProvider = "MOCK" | "ICAFE_CLOUD";

export function getAdapter(provider: IntegrationProvider): CafeIntegrationAdapter {
  switch (provider) {
    case "MOCK":
      return new MockCafeAdapter();
    case "ICAFE_CLOUD":
      return new ICafeCloudAdapter();
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

export * from "./types.js";
export { MockCafeAdapter } from "./MockCafeAdapter.js";
export { ICafeCloudAdapter } from "./ICafeCloudAdapter.js";
