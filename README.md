# Bounded Execution Ledger

A local execution ledger for trusted task handlers. Register your own action, submit an explicit permission decision, and retain its request, outputs, status, failures and event log.

## Try it

Node.js 20 or newer. The example runs entirely locally.

```sh
npm ci
npm run demo
```

[examples/first-handler.mjs](examples/first-handler.mjs) registers a whitespace normalizer. It produces `hello ledger`, records an invalid-input failure, and denies a third request without calling the handler. Reopening the ledger finds all three runs. The script prints the evidence directory.

## How it works

Evidence of what was requested and returned belongs to the execution boundary itself. Read the [mechanism and implementation notes](docs/MECHANISM.md) for the specific boundaries and source links.

## Scope

“Bounded” refers to an explicit request/policy/evidence boundary; custom JavaScript is trusted and has no enforced wall-clock deadline or OS sandbox. Errors and submitted values enter the local evidence, so use synthetic inputs when sharing a run. To import it elsewhere, build, `npm pack`, install the resulting local archive, and import `createLedger` from `bounded-execution-ledger`.

## Verify

`npm run check` and `npm test` exercise the original behavior, a consumer-created example and concurrent JSON readers.

MIT licensed; see [LICENSE.md](LICENSE.md). Origin and release boundaries are documented in [ORIGIN.md](ORIGIN.md) and [SECURITY.md](SECURITY.md).
## Inspect the example result

Open the [saved synthetic result](examples/captured-result.json) alongside its [input and demonstration](examples/first-handler.mjs). The result is from the bundled synthetic example; local machine paths and temporary run identifiers are excluded from public projections.
