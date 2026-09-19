import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = await mkdtemp(path.join(os.tmpdir(), "bounded-execution-ledger-consumer-"));
try {
  const output = execFileSync(process.execPath, ["examples/first-handler.mjs", root], { encoding: "utf8" });
  assert.ok(JSON.parse(output).evidenceRoot);
  const { createLedger } = await import("bounded-execution-ledger");
  const ledger = createLedger(root);
  ledger.registerHandler("demo.mutate", (submission) => { submission.input.text = "changed"; return []; });
  assert.throws(() => ledger.registerHandler("demo.mutate", () => []), /already registered/);
  assert.throws(() => ledger.registerHandler(undefined, () => []), /valid action ID/);
  const request = { actionKind: "custom", actionId: "demo.mutate", requestedByOwnerId: "demo", environmentId: "local", ownerRefs: [], input: { text: "original" }, permissionDecision: { ok: true, checkedAt: new Date().toISOString(), summary: "Demo", checks: [], denials: [] } };
  const mutated = await ledger.submit(request);
  assert.equal(mutated.status, "complete");
  assert.equal((await ledger.getRun(mutated.runId)).input.text, "original");
  const unknown = await ledger.submit({ ...request, actionId: "missing" });
  assert.equal(unknown.status, "failed");
  ledger.registerHandler("bad.output", () => [{ body: 42 }]);
  assert.equal((await ledger.submit({ ...request, actionId: "bad.output" })).status, "failed");
  console.log("Public consumer demonstration passed.");
} finally {
  // The only recursive cleanup target is the exact directory created above.
  await rm(root, { recursive: true, force: true });
}
