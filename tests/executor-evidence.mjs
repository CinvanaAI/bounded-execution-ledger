import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { BoundedExecutorService, StorageSubstrateService } from "../dist/index.js";

const dataRoot = await mkdtemp(path.join(os.tmpdir(), "bounded-executor-test-"));

const allowed = {
  ok: true,
  checkedAt: new Date().toISOString(),
  summary: "Synthetic permission checks passed.",
  checks: [{ checkId: "synthetic", ok: true, summary: "Allowed for test." }],
  denials: []
};
const denied = {
  ok: false,
  checkedAt: new Date().toISOString(),
  summary: "Synthetic permission check denied the action.",
  checks: [{ checkId: "synthetic", ok: false, summary: "Denied for test." }],
  denials: ["Denied for test."]
};

try {
  const storage = new StorageSubstrateService(dataRoot);
  const executor = new BoundedExecutorService(storage);

  const complete = await executor.submit({
    actionKind: "agent.workflow",
    actionId: "workflow.synthetic",
    requestedByOwnerId: "agents",
    requestedByRecordId: "agent.synthetic.1",
    environmentId: "agent-hall",
    ownerRefs: ["agents:instance:agent.synthetic.1"],
    permissionDecision: allowed,
    input: {
      workflowLabel: "Synthetic review",
      instruction: "Review the synthetic targets.",
      targets: [{ path: "/synthetic/example.md", permitted: true }],
      packages: []
    }
  });
  assert.equal(complete.status, "complete");
  assert.equal(complete.outputs.length, 2);
  assert.equal(JSON.parse(complete.outputs[0].body).targetCount, 1);

  const blocked = await executor.submit({
    actionKind: "agent.workflow",
    actionId: "workflow.denied",
    requestedByOwnerId: "agents",
    environmentId: "agent-hall",
    ownerRefs: [],
    permissionDecision: denied,
    input: {}
  });
  assert.equal(blocked.status, "denied");
  assert.equal(blocked.outputs.length, 0);
  assert.deepEqual(blocked.permissionDenials, ["Denied for test."]);

  const failed = await executor.submit({
    actionKind: "unregistered.action",
    actionId: "unregistered.synthetic",
    requestedByOwnerId: "test",
    environmentId: "test",
    ownerRefs: [],
    permissionDecision: allowed,
    input: {}
  });
  assert.equal(failed.status, "failed");
  assert.equal(failed.failures.length, 1);
  assert.match(failed.failures[0].summary, /No bounded action handler/);

  const observability = await executor.inspectObservability();
  assert.equal(observability.runCount, 3);
  assert.equal(observability.completeCount, 1);
  assert.equal(observability.deniedCount, 1);
  assert.equal(observability.failedCount, 1);

  const loaded = await executor.getRun(complete.runId);
  assert.equal(loaded.runId, complete.runId);
  assert.equal(loaded.events.some((event) => event.type === "complete"), true);

  console.log("Bounded execution evidence test passed.");
} finally {
  await rm(dataRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
