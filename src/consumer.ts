import { BoundedExecutorService } from "./owners/execution-environment/src/executor.js";
import { StorageSubstrateService } from "./owners/storage/src/service.js";

/** Create a local single-writer ledger; register trusted handlers before submitting. */
export function createLedger(dataRoot: string) {
  return new BoundedExecutorService(new StorageSubstrateService(dataRoot));
}
