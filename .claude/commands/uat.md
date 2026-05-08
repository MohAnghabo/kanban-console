---
description: Draft a full browser UAT plan from a durable task plan and user stories.
argument-hint: "<task-name> [--atlas] [--output <path>]"
---

Draft UAT for: $ARGUMENTS

This command creates a local-only UAT draft by default. It must not write to
GitHub, GitHub Projects, provider services, git state, deployment targets, or
tracked docs unless the user explicitly asks.

## Purpose

Generate a full browser UAT document from `docs/tasks/<task-name>.md` and the
task's selected user stories. The default output path is:

```text
.local/uat/<task-name>.md
```

Use Atlas-ready instructions when `--atlas` is present or when the user asks for
ChatGPT Atlas browser testing.

## Required Reading

1. `AGENTS.md`
2. `docs/project.md`
3. `review.md`
4. `.ai/rules/00-constitution.md`
5. `.ai/rules/15-pdpl-compliance.md`
6. `.ai/rules/17-aws-well-architected.md`
7. `.ai/rules/18-pr-readiness.md`
8. `.ai/rules/22-kanban-console.md`
9. `docs/tasks/<task-name>.md`
10. Referenced `.local/user-stories/<feature-name>.md` when present

## Step A - Resolve Inputs

Parse `$ARGUMENTS` into:

- task name
- optional output path
- optional Atlas mode

If `docs/tasks/<task-name>.md` does not exist, stop and ask whether to run
`/plan` first.

If the plan references a `.local/user-stories` draft and it exists, read it.
If it does not exist, continue from the user stories embedded in the durable
plan and report the missing draft as a gap.

## Step B - Extract Test Basis

Extract:

- Objective.
- Selected user stories.
- Acceptance criteria.
- Phase validations.
- Constraints and stop gates.
- Data/privacy notes.
- Localization notes.
- Security, secret, and PDPL requirements.
- Deployment, GitHub Project, git, release, tag, and provider write risks.

Do not invent passing behavior that the plan does not support. Mark unknowns as
`NOT VERIFIED` or `GAP`.

## Step C - Generate UAT Structure

Write a UAT document with:

1. Scope
2. Preconditions
3. Test data
4. Environment setup
5. Browser/Atlas instructions
6. Scenarios mapped to user stories
7. Cross-cutting checks:
   - AR/EN
   - RTL
   - PDPL/no PII
   - Secret redaction
   - Accessibility
   - Keyboard navigation
   - Performance
   - Reconnect/restart
   - Backend/API health
8. Destructive or external write stop gates
9. Evidence to capture
10. Pass/fail log
11. Open issues
12. Sign-off

## Step D - Atlas Browser Instructions

When drafting Atlas instructions:

- Name the exact URL placeholder, for example `<LOCAL_APP_URL>`.
- Tell Atlas to click every visible primary navigation tab.
- Tell Atlas to toggle Arabic/English when available.
- Tell Atlas to verify `dir="rtl"` after Arabic toggle.
- Tell Atlas to avoid writes unless the user explicitly confirms in-session.
- Tell Atlas to report `NOT VERIFIED` instead of `FAIL` when it did not attempt
  a step.
- Tell Atlas to capture screenshots or notes for failed expectations.
- Tell Atlas to search visible UI for common token patterns without copying
  real secrets.

Hard stop before:

- GitHub Project writes.
- GitHub issue/PR comments.
- Git stage/unstage/commit/push.
- Auto-fix launch.
- Deploy/release/tag/merge.
- File writes outside clearly mocked flows.

## Step E - Write Output

Create the output directory if needed and write the UAT draft. Default:

```bash
mkdir -p .local/uat
```

```text
.local/uat/<task-name>.md
```

Do not promote the UAT into `docs/` unless the user explicitly asks for a
permanent product document.

## Step F - Report

Return:

- UAT draft path.
- Stories covered.
- Scenarios generated.
- Stop gates included.
- Gaps or assumptions.
- Exact prompt excerpt to give Atlas if requested.

## Rules

- No real PII in UAT text, screenshots, logs, prompts, or fixtures.
- No secrets or credential fragments.
- No raw CI or provider logs.
- Use synthetic examples by default.
- Use `PASS`, `FAIL`, `PARTIAL PASS`, `NOT VERIFIED`, and `GAP` consistently.
- Keep UAT evidence local unless the user explicitly asks to publish it.
