import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createLedger } from "bounded-execution-ledger";

const root = process.argv[2] ?? await mkdtemp(path.join(os.tmpdir(), "ledger-demo-"));
const ledger = createLedger(root);
let calls = 0;
ledger.registerHandler("text.normalize", ({ input }) => {
  calls += 1;
  if (typeof input.text !== "string") throw new Error("text must be a string");
  return [{ label: "Normalized text", mediaType: "text/plain", body: input.text.trim().replace(/\s+/g, " ") }];
});
const submit = (text, permitted = true) => ledger.submit({ actionKind: "custom", actionId: "text.normalize",
  requestedByOwnerId: "demo", environmentId: "local", ownerRefs: ["demo"], input: { text },
  permissionDecision: { ok: permitted, checkedAt: new Date().toISOString(), summary: "Demo application policy", checks: [], denials: permitted ? [] : ["Not approved"] } });
const success = await submit("  hello    ledger  ");
const failed = await submit(42);
const denied = await submit("unused", false);
assert.equal(success.outputs[0].body, "hello ledger");
assert.equal(failed.status, "failed");
assert.equal(denied.status, "denied");
assert.equal(calls, 2);
const reopened = createLedger(root);
assert.equal((await reopened.getRun(success.runId)).outputs[0].body, "hello ledger");
console.log(JSON.stringify({ success: success.status, output: success.outputs[0].body, failed: failed.status,
  denied: denied.status, handlerCalls: calls, durableRuns: (await reopened.listRuns()).length, evidenceRoot: root }, null, 2));
