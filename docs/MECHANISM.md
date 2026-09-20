# Bounded Execution Ledger: mechanism

[createLedger](../src/consumer.ts) opens the file-backed executor. [registerHandler and submit](../src/owners/execution-environment/src/executor.ts) keep custom actions separate from built-in action kinds. A handler receives a copied submission and returns `{label, mediaType, body}` objects. The executor assigns output IDs/timestamps and validates output shape and size (at most 100 outputs and one megabyte of JSON). Handler exceptions become failed run records. Saved JSON records are atomically replaced.

## Limits that matter

“Bounded” refers to an explicit request/policy/evidence boundary; custom JavaScript is trusted and has no enforced wall-clock deadline or OS sandbox. Errors and submitted values enter the local evidence, so use synthetic inputs when sharing a run. To import it elsewhere, build, `npm pack`, install the resulting local archive, and import `createLedger` from `bounded-execution-ledger`.

## Demonstration contract

Input: A registered text-normalizing handler and an explicit permission decision.

Expected observation: complete: hello ledger; failed invalid input; denied request never invokes handler; three durable runs.

The bundled example uses synthetic material. Its observed output establishes that bounded path, not every possible integration.

## The application's side of the contract

The [first handler](../examples/first-handler.mjs) is a complete consumer. Create
one ledger per data root, register a stable custom action ID, and submit a plain,
cloneable request with `actionKind: "custom"`. The request includes its input,
owner references, environment and `permissionDecision`. The ledger records that
supplied decision; it does not authenticate the caller or derive authorization.
The application must compute the decision before calling `submit`.

Submission snapshots the request before asynchronous writes, so later caller or
handler mutations cannot rewrite the input that the ledger records. A denied
request persists as `denied` without invoking the handler. An authorized request
is saved as `running`, then as `complete` with validated outputs or `failed` with
the thrown message. Expected action failures are returned records: inspect
`run.status`, not merely whether the promise resolved. Storage errors can reject
the promise; inspect available evidence before deciding whether to retry.

Handlers return an array of `{label, mediaType, body}` strings. Each body is the
actual retained output, not a reference to data the ledger fetches elsewhere.
An async handler is awaited. Output limits are checked after the handler returns;
they do not bound memory, time or effects while it runs. A failed handler can have
already changed external state, and the ledger does not roll that back.

Reopening the same root restores records, not handler registrations. Register
actions again before new submissions. `getRun(id)` reads one record,
`listRuns()` returns at most 50 recent runs by default, and
`inspectObservability()` returns total status counts. A `running` record after
process interruption is unresolved evidence, not an automatic retry request.
The inherited storage readers may treat unreadable records as absent; the ledger
is not a corruption-recovery system. Preserve the data root before investigation.

The storage layer atomically replaces individual JSON files. Run state, event
stream and artifacts are separate writes, not one database transaction. Use one
writer per root. The built-in action kinds retain Skeleton integration contracts;
custom handlers are the independent visitor path demonstrated here.
