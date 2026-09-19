# Bounded Execution Ledger: mechanism

[createLedger](../src/consumer.ts) opens the file-backed executor. [registerHandler and submit](../src/owners/execution-environment/src/executor.ts) keep custom actions separate from built-in action kinds. A handler receives a copied submission and returns `{label, mediaType, body}` objects. The executor assigns output IDs/timestamps and validates output shape and size (at most 100 outputs and one megabyte of JSON). Handler exceptions become failed run records. Saved JSON records are atomically replaced.

## Limits that matter

“Bounded” refers to an explicit request/policy/evidence boundary; custom JavaScript is trusted and has no enforced wall-clock deadline or OS sandbox. Errors and submitted values enter the local evidence, so use synthetic inputs when sharing a run. To import it elsewhere, build, `npm pack`, install the resulting local archive, and import `createLedger` from `bounded-execution-ledger`.

## Demonstration contract

Input: A registered text-normalizing handler and an explicit permission decision.

Expected observation: complete: hello ledger; failed invalid input; denied request never invokes handler; three durable runs.

The bundled example uses synthetic material. Its observed output establishes that bounded path, not every possible integration.
