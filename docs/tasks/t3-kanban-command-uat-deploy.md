---
task_name: t3-kanban-command-uat-deploy
github_issue: 28
last_updated: 2026-05-09
---

# Task: t3-kanban-command-uat-deploy

## 1. Objective

Add complete command-surface support for deploy and UAT workflows, make
`/phase` keep user stories synchronized when plan scope changes, and define
browser UAT instructions that can be executed by ChatGPT Atlas.

Story draft: `.local/user-stories/t3-kanban-command-uat-deploy.md`.

Selected MVP stories:

- `US-001` - Atlas-ready browser UAT draft
- `US-002` - Deployment readiness command
- `US-003` - Full canonical command launcher parity
- `US-004` - Phase user-story synchronization
- `US-005` - Secret and environment command guidance

## 2. User Stories

The detailed story draft lives at
`.local/user-stories/t3-kanban-command-uat-deploy.md`.

Summary:

- `US-001`: `/uat <task-name>` drafts a complete Atlas-ready UAT under
  `.local/uat/`.
- `US-002`: `/deploy` asks missing deployment questions, checks readiness, and
  stops before any deploy/release/tag write until explicit approval.
- `US-003`: Kanban agent workflows expose the full canonical command surface
  from `.claude/commands` for Claude and Codex.
- `US-004`: `/phase` updates user stories when scope, dependencies, acceptance
  criteria, data/privacy notes, or localization notes change.
- `US-005`: command docs clearly identify Doppler, env, secret, and security
  check responsibilities.

## 3. Scope

In scope:

- Add canonical `.claude/commands/deploy.md` and `.claude/commands/uat.md`.
- Regenerate `.codex/commands` wrappers and keep `bun codex:check` green.
- Extend `KanbanConsoleAgentWorkflowCommandId` and server launcher recipes to
  include all canonical commands.
- Make the mock UI show the expanded command surface without silently slicing to
  four workflows.
- Add tests that compare launcher command IDs to `.claude/commands`.
- Update `/phase` runbook so user-story synchronization is mandatory when plan
  scope changes.
- Add a UAT draft generator or runbook that creates `.local/uat/<task-name>.md`
  from `docs/tasks/<task-name>.md` and its selected user stories.
- Add deployment readiness runbook covering web, GitHub release, Docker,
  Vercel, Render, local/staging/production, GitHub Actions secrets, Doppler,
  Vercel/Render envs, local `.env`, git revert rollback, and tag/release gates.
- Add a current Atlas browser UAT prompt for the Kanban Project Console.

Out of scope:

- Performing production deploys by default.
- Writing GitHub Project state without explicit approval.
- Storing real secrets, tokens, PII, or raw command logs in generated UAT or
  deploy artifacts.
- Implementing provider-specific deploy APIs beyond safe command/runbook
  readiness unless explicitly approved.

## 4. Requirements

- `/deploy` must be prepare/check-only until explicit approval.
- Production deploy/tag/release must require second confirmation.
- `/deploy` must ask questions when target, environment, provider identifiers,
  secret source, release version, tag, or rollback information is missing.
- `/deploy` must never print secret values.
- `/uat` must write to `.local/uat/` by default.
- `/uat` must generate browser-agent steps, expected results, evidence capture,
  pass/fail criteria, and stop gates for mutating actions.
- `/phase` must update user stories when plan changes alter story-relevant
  details.
- Command launcher parity must include every `.claude/commands/*.md` command:
  `env-audit`, `execute-task`, `extract-pr-learnings`, `ifrs-audit`,
  `init-project`, `open-pr`, `orchestrate`, `pdpl-audit`, `phase`, `plan`,
  `plan-status`, `preflight`, `review`, `security-audit`, `ship`,
  `upgrade-multitenant`, `user-stories`, plus new `deploy` and `uat`.
- User-facing labels and setup-required states in the app need AR/EN coverage.

## 5. Constraints

- Follow AGENTS.md and `.ai/rules/22-kanban-console.md` for every product
  change.
- Keep implementation in `MohAnghabo/kanban-console`.
- `.codex/commands` are generated; edit `.claude/commands` first and run
  `bun codex:sync`.
- `docs/tasks/_template.md` is absent in this fork, so this draft uses the
  existing `t3-kanban-project-console` plan structure.
- `scripts/plan-status.ts` is absent and must be restored or the
  `/plan-status` command remains only a runbook shell.

## 6. Well-Architected Impact

- Operational excellence: adds repeatable UAT and deploy runbooks with explicit
  gates, evidence, rollback, and command-surface parity.
- Security: strengthens secret handling by requiring Doppler/env/security checks
  and preventing secret values in deploy/UAT outputs.
- Reliability: makes deploy readiness check-only by default and requires
  confirmations before mutating external systems.
- Performance efficiency: UAT includes large-board and browser performance
  checks without adding always-on runtime services.
- Cost optimization: deploy readiness should identify provider targets before
  creating or running paid resources.
- Sustainability: reusable command runbooks and generated UAT reduce repeated
  manual effort and command drift.

## 7. Gaps and Questions

- Docker registry, image names, and publishing policy are unspecified.
- Vercel project/team and Render service names are unspecified.
- Staging and production domains are unspecified.
- GitHub release naming and semantic version policy are unspecified.
- Atlas evidence format and storage target are unspecified.
- Whether `upgrade-multitenant` should be exposed as a normal Kanban workflow
  or setup-only workflow needs confirmation.
- `docs/project.md` currently says local-first v1 uses `dev` and `prod`
  configuration surfaces only; this plan introduces `staging`, so environment
  topology must be reconciled before deployment work is marked complete.

## 8. Assumptions

- The requested environment names are `local`, `staging`, and `production`.
- Git revert is the primary rollback path.
- GitHub release/tag creation is in scope and approval-gated.
- UAT and deploy generated artifacts are local-only unless the maintainer asks
  to promote them into permanent docs.
- Real GitHub writes remain stop-gated during Atlas UAT.

## 9. Risks

- Atlas may execute write actions if UAT stop gates are not explicit.
- Deployment checks may become misleading if provider identifiers are omitted.
- Secret checks can leak values if provider output is copied directly.
- Command parity can drift again unless tested against `.claude/commands`.
- Adding `staging` without reconciling `docs/project.md` environment topology
  can conflict with existing preflight/env-audit rules.

## 10. Phased Plan

### Phase 1: Command Runbooks And Sync

- Goal:
  - Add `/deploy` and `/uat` canonical runbooks, update `/phase` story-sync
    rules, and regenerate Codex wrappers.
- Dependencies: none.
- Tasks:
  - [x] Add `.claude/commands/deploy.md`.
  - [x] Add `.claude/commands/uat.md`.
  - [x] Update `.claude/commands/phase.md` to require user-story sync review
        and updates when phase scope changes.
  - [x] Run `bun codex:sync`.
  - [x] Add tests or checks that command wrapper sync includes the new commands.
- Validation:
  - `bun codex:check`
  - `bun check`
- Exit criteria:
  - Claude and Codex command surfaces include `/deploy` and `/uat`, and `/phase`
    documents the user-story sync gate.

### Phase 2: Launcher Parity

- Goal:
  - Make the Kanban workflow launcher reflect the full canonical command
    surface.
- Dependencies: Phase 1.
- Tasks:
  - [ ] Extend `KanbanConsoleAgentWorkflowCommandId`.
  - [ ] Extend `AgentWorkflowLauncher` recipe generation for all canonical
        commands.
  - [ ] Add an invariant test comparing launcher command IDs against
        `.claude/commands/*.md`.
  - [ ] Update mock provider data and UI rendering so workflows are grouped or
        fully visible instead of sliced to four.
  - [ ] Add AR/EN labels for any newly visible command workflow labels.
- Validation:
  - Contract tests
  - Agent workflow launcher tests
  - Kanban mock UI tests
  - `bun check`
- Exit criteria:
  - Every canonical command is exposed or intentionally marked setup-only with
    tests preventing silent drift.

### Phase 3: UAT Generator And Atlas Prompt

- Goal:
  - Generate full Atlas-ready browser UAT from a durable plan and selected user
    stories.
- Dependencies: Phase 1.
- Tasks:
  - [ ] Implement `/uat <task-name>` runbook or script to read
        `docs/tasks/<task-name>.md`.
  - [ ] Generate `.local/uat/<task-name>.md`.
  - [ ] Include browser steps, expected results, evidence capture, pass/fail
        log, cross-cutting checks, and stop gates.
  - [ ] Add current Kanban Console Atlas UAT prompt.
  - [ ] Add tests for story/acceptance criteria extraction where practical.
- Validation:
  - UAT generation smoke test
  - Markdown lint/format where available
  - `bun check`
- Exit criteria:
  - Maintainer can hand the generated prompt to ChatGPT Atlas for browser UAT.

### Phase 4: Deploy Readiness

- Goal:
  - Add a safe deployment readiness workflow for web, GitHub releases, Docker,
    Vercel, and Render.
- Dependencies: Phase 1.
- Tasks:
  - [ ] Encode deploy question gates for missing target/environment/provider
        details.
  - [ ] Check GitHub Actions secrets, Doppler, Vercel, Render, and local `.env`
        readiness without printing values.
  - [ ] Run or reference `/env-audit`, `/preflight`, `/security-audit`, and
        `/review` as required gates.
  - [ ] Add explicit approval and second-confirmation stop points for
        deploy/tag/release writes.
  - [ ] Document git revert rollback.
  - [ ] Reconcile `staging` with `docs/project.md` environment topology.
- Validation:
  - Deploy runbook dry-run
  - Env/preflight checks where available
  - Secret redaction review
  - `bun check`
- Exit criteria:
  - `/deploy` can prepare and check deployment readiness without performing
    external mutations unless explicitly approved.

## 11. Acceptance Criteria

- [ ] `/deploy` exists in `.claude/commands` and `.codex/commands`.
- [ ] `/uat` exists in `.claude/commands` and `.codex/commands`.
- [ ] `/phase` requires user-story sync review and updates.
- [ ] Launcher contracts include all canonical command IDs.
- [ ] Server launcher lists Claude and Codex recipes for all canonical commands.
- [ ] Mock UI exposes all workflows or grouped workflow access without silent
      truncation.
- [ ] `/uat` can generate an Atlas-ready browser UAT draft from
      `t3-kanban-project-console`.
- [ ] `/deploy` asks missing deployment questions and stops before external
      writes.
- [ ] Doppler, env-audit, preflight, security-audit, and secret-management
      responsibilities are documented.
- [ ] No real PII, secrets, or raw logs appear in generated prompts, tests, or
      docs.
- [ ] AR/EN labels exist for newly user-facing command workflow labels.

## 12. Execution Log

Append one entry per implementation pass.

### 2026-05-09 - planning draft

- Summary:
  - Created a local-only plan draft for UAT/deploy commands, command launcher
    parity, and `/phase` user-story synchronization.
- Files changed:
  - `.local/user-stories/t3-kanban-command-uat-deploy.md`
  - `.local/tasks/t3-kanban-command-uat-deploy.md`
- Validation run:
  - Not run; planning draft only.
- Notes/deviations:
  - Draft remains local-only until explicitly published.
  - `docs/tasks/_template.md` and `scripts/plan-status.ts` are absent in this
    fork and are recorded as plan gaps.

### 2026-05-09 - Phase 1 command runbooks and sync

- Command:
  - `/phase t3-kanban-command-uat-deploy phase-1`
- Summary:
  - Added canonical `/deploy` and `/uat` Claude runbooks.
  - Regenerated Codex command wrappers so the command surface now includes 19
    wrappers.
  - Updated `/phase` to require user-story sync review and updates when phase
    scope, dependencies, acceptance criteria, data/privacy notes, localization
    notes, or user-facing behavior change.
  - Kept `/deploy` prepare/check-only by default with explicit approval and
    second-confirmation gates for production deploy, release, and tag actions.
  - Kept `/uat` local-only by default, writing UAT drafts under `.local/uat/`
    with hard stop gates for GitHub, git, deploy, release, tag, and file-write
    mutations.
- Files changed:
  - `.claude/commands/deploy.md`
  - `.claude/commands/uat.md`
  - `.claude/commands/phase.md`
  - `.codex/commands/deploy.md`
  - `.codex/commands/uat.md`
  - `.codex/commands/phase.md`
  - `apps/web/src/routes/kanban.tsx`
  - `docs/tasks/t3-kanban-command-uat-deploy.md`
- Validation run:
  - Command: `bun codex:sync`
  - Result: PASS; 19 command wrappers synced.
  - Command: `bun codex:check`
  - Result: PASS; 19 command wrappers checked and environment command docs
    validated.
  - Command: `bun check`
  - Result: PASS; 15/15 tasks successful, 134 test files passed and 1 skipped
    with 1062 tests passed and 4 skipped.
- Story sync:
  - Reviewed selected user stories. No story text changes were required because
    the Phase 1 implementation matched the published plan and existing
    `US-001`, `US-002`, `US-004`, and `US-005` coverage.
- Notes/deviations:
  - The existing `/kanban` SidebarProvider hotfix remains in the same worktree
    and should be included in this PR or split into a tiny hotfix PR.
