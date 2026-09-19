# Security posture

The executor accepts only action kinds with registered handlers. Permission denials are persisted before execution, and allowed actions retain structured outputs or failures.

This is not an operating-system sandbox. The included agent-workflow handler produces deterministic summary/target evidence. The optional capability-package handler can execute trusted published Python in a temporary directory; untrusted package source must not be supplied.

The test never invokes Python, reads its synthetic target path, or leaves its temporary owner-record tree behind.
