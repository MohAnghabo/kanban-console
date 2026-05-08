# Kanban Console Daily-Use Readiness

This checklist is the controlled-use gate for running Kanban Console against
real local repositories. It does not grant permission to write GitHub Projects
state; Project writes still require explicit maintainer confirmation.

## Before Daily Use

1. Confirm GitHub CLI auth for the owner that owns the managed repositories:
   `gh auth status`.
2. Confirm the selected repository is a local clone under the expected owner.
3. Run the local readiness gate:
   `bun run kanban:daily-check`.
4. Run the governance drift check against the source template manifest:
   `bash scripts/verify-template-adoption.sh --profile minimal --manifest /Users/mohanghabo/Projects/ai-starter-pro/.template/adoption/minimal-files.txt`.
5. For UI changes, run the browser smoke directly when debugging:
   `bun run --cwd apps/web test:browser -- KanbanConsoleMock`.

## Hardening Coverage

- Performance: `bun run kanban:hardening-check` runs the large-board fixture
  test in `apps/web/src/kanbanConsoleMock.test.ts`, which groups and moves
  12,000 cards without mutating the source fixture.
- Reconnect/restart: `bun run kanban:hardening-check` runs focused WebSocket,
  auth bootstrap, session stale-state, provider-session directory, and server
  environment restart coverage.
- Keyboard and accessibility: the Kanban mock browser smoke verifies real tab
  traversal, accessible button names, primary view activation, and Arabic RTL
  mode. Add focused browser tests for any new workflow surface.
- Release/security invariants: release and GitOps changes must test shared
  contracts, provider decisions, emitted GitHub comments, and EN/AR UI labels
  when those layers share behavior.
- Governance drift: `bun check` enforces Codex/Claude command wrapper drift,
  and the template adoption check compares the adopted governance surface to
  the source manifest.

## Safe Operating Rules

- Treat diffs, CI logs, review comments, and command output as sensitive until
  redacted.
- Never paste raw command output into GitHub comments. Use concise summaries.
- Mutating git, GitHub, CLI, release, and agent actions require confirmation;
  destructive actions require the configured second confirmation.
- If a provider, CLI, or GitHub integration is missing or unauthenticated,
  surface a setup-required state instead of retrying noisy writes.
