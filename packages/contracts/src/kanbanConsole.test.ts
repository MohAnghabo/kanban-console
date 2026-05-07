import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  KanbanConsoleAutoFixRun,
  KanbanConsoleCliAuditRecord,
  KanbanConsoleCliExecutionResult,
  KanbanConsoleGitFileActionRequest,
  KanbanConsoleGitFileDiff,
  KanbanConsoleArtifactContent,
  KanbanConsoleArtifactWriteRequest,
  KanbanConsoleArtifactWriteResult,
  KanbanConsolePrWatchActionComment,
  KanbanConsoleSnapshot,
  KanbanConsoleSuggestedFix,
  KanbanConsoleTaskContextPackage,
  KanbanConsoleTaskTransitionRequest,
} from "./kanbanConsole.ts";

const decodeSnapshot = Schema.decodeUnknownSync(KanbanConsoleSnapshot);
const decodeTaskContext = Schema.decodeUnknownSync(KanbanConsoleTaskContextPackage);
const decodeTransitionRequest = Schema.decodeUnknownSync(KanbanConsoleTaskTransitionRequest);
const decodeGitFileActionRequest = Schema.decodeUnknownSync(KanbanConsoleGitFileActionRequest);
const decodeGitFileDiff = Schema.decodeUnknownSync(KanbanConsoleGitFileDiff);
const decodeArtifactContent = Schema.decodeUnknownSync(KanbanConsoleArtifactContent);
const decodeArtifactWriteRequest = Schema.decodeUnknownSync(KanbanConsoleArtifactWriteRequest);
const decodeArtifactWriteResult = Schema.decodeUnknownSync(KanbanConsoleArtifactWriteResult);
const decodeSuggestedFix = Schema.decodeUnknownSync(KanbanConsoleSuggestedFix);
const decodePrWatchActionComment = Schema.decodeUnknownSync(KanbanConsolePrWatchActionComment);
const decodeAutoFixRun = Schema.decodeUnknownSync(KanbanConsoleAutoFixRun);
const decodeCliAuditRecord = Schema.decodeUnknownSync(KanbanConsoleCliAuditRecord);
const decodeCliExecutionResult = Schema.decodeUnknownSync(KanbanConsoleCliExecutionResult);

describe("kanbanConsole contracts", () => {
  it("decodes a complete mock-runtime snapshot boundary", () => {
    const decoded = decodeSnapshot({
      version: 1,
      generatedAt: "2026-05-06T13:30:00.000Z",
      locale: "en",
      repos: [
        {
          id: "repo-1",
          name: "kanban-console",
          owner: "MohAnghabo",
          path: "/tmp/kanban-console",
          branch: "feature/contracts",
          ahead: 1,
          behind: 0,
          openPrs: 1,
          activeTasks: 2,
          status: "healthy",
        },
      ],
      boards: [
        {
          id: "board-1",
          owner: "MohAnghabo",
          title: "Kanban Project Console",
          source: "github-projects",
          columns: ["backlog", "ready", "in-progress", "review", "blocked", "done"],
        },
      ],
      tasks: [
        {
          id: "task-1",
          issue: "kanban-console#1",
          title: "Contracts",
          titleAr: "العقود",
          repo: "kanban-console",
          column: "ready",
          priority: "P1",
          assignee: "Codex",
          checks: { passing: 1, pending: 0, failing: 0 },
          agent: "Codex",
          agentSessionStatus: "queued",
          updated: "2026-05-06T10:20:00.000Z",
          comments: 0,
        },
      ],
      prWatches: [],
      suggestedFixes: [],
      commandRuns: [],
      gitStatuses: [
        {
          repoId: "repo-1",
          cwd: "/tmp/kanban-console",
          isRepo: true,
          branch: "feature/contracts",
          upstream: "origin/feature/contracts",
          ahead: 1,
          behind: 0,
          aheadOfDefault: 1,
          files: [
            {
              path: "packages/contracts/src/kanbanConsole.ts",
              sourcePath: "packages/contracts/src/kanbanConsole.old.ts",
              status: "staged",
              change: "renamed",
              additions: 12,
              deletions: 2,
              diffAvailable: true,
              hunkStaging: "supported",
            },
            {
              path: "docs/product/new.md",
              status: "untracked",
              change: "added",
              additions: 4,
              deletions: 0,
              diffAvailable: true,
              hunkStaging: "not-applicable",
            },
          ],
          policyViolations: [
            {
              id: "missing-upstream",
              kind: "missing-upstream",
              severity: "warning",
              message: "Branch has no upstream.",
            },
          ],
        },
      ],
      artifacts: [],
      gitOpsPolicy: {
        protectedBranches: ["main"],
        allowedWorkBranchPrefixes: ["feature/"],
        destructiveActionsRequireSecondConfirmation: true,
      },
      releaseReadiness: {
        branch: "release/test",
        latestTag: "v0.1.0",
        targetTag: "v0.2.0",
        gates: [{ id: "gate-1", label: "Validate", status: "pending" }],
      },
      agentWorkflows: [
        {
          id: "codex-phase",
          label: "Codex /phase",
          agent: "Codex",
          command: "/phase t3-kanban-project-console phase-5",
          commandId: "phase",
          available: true,
        },
      ],
      agentSessions: [
        {
          id: "session-1",
          taskId: "task-1",
          workflowId: "codex-phase",
          agent: "Codex",
          command: "/phase t3-kanban-project-console phase-5",
          status: "queued",
          duplicateKey: "task-1:codex-phase:ready",
          duplicateSuppressed: false,
          summary: "Queued Codex workflow.",
          startedAt: "2026-05-06T10:21:00.000Z",
        },
      ],
      cliAdapters: [
        {
          id: "gh",
          label: "GitHub CLI",
          command: "gh",
          availability: "available",
          mutationPolicy: "requires-confirmation",
          timeoutMs: 30000,
        },
      ],
      cliAudit: [
        {
          id: "cli-audit-1",
          tool: "gh",
          command: "gh",
          args: ["pr", "checks", "20"],
          cwd: "/tmp/kanban-console",
          status: "succeeded",
          mutates: false,
          confirmed: false,
          startedAt: "2026-05-06T10:22:00.000Z",
          completedAt: "2026-05-06T10:22:01.000Z",
          durationMs: 1000,
          exitCode: 0,
          stdoutTruncated: false,
          stderrTruncated: false,
        },
      ],
    });

    expect(decoded).toMatchObject({
      version: 1,
      tasks: [{ id: "task-1", column: "ready" }],
      agentSessions: [{ status: "queued" }],
      cliAdapters: [{ id: "gh" }],
    });
    expect(decoded.gitStatuses[0]?.files.some((file) => file.hunkStaging === "supported")).toBe(
      true,
    );
    expect(decoded.gitStatuses[0]?.files[0]?.sourcePath).toBe(
      "packages/contracts/src/kanbanConsole.old.ts",
    );
    expect(decoded.releaseReadiness.targetTag).toBe("v0.2.0");
  });

  it("decodes the shared task context package used by agent launchers", () => {
    expect(
      decodeTaskContext({
        task: {
          id: "task-1",
          issue: "kanban-console#43",
          title: "Launch agent workflow",
          repo: "kanban-console",
          column: "ready",
          priority: "P1",
        },
        project: {
          id: "board-1",
          owner: "MohAnghabo",
          title: "Kanban Project Console",
        },
        repo: {
          id: "repo-1",
          owner: "MohAnghabo",
          name: "kanban-console",
          path: "/tmp/kanban-console",
          branch: "feature/agent-launchers",
        },
        issueUrl: "https://github.com/MohAnghabo/kanban-console/issues/43",
        prUrl: "https://github.com/MohAnghabo/kanban-console/pull/7",
        artifacts: [{ path: "docs/tasks/t3-kanban-project-console.md", status: "clean" }],
        validationCommands: ["bun check"],
        governanceRules: ["AGENTS.md", ".ai/rules/22-kanban-console.md"],
      }),
    ).toMatchObject({
      task: { id: "task-1" },
      validationCommands: ["bun check"],
    });
  });

  it("rejects unknown Kanban transition columns", () => {
    expect(() =>
      decodeTransitionRequest({
        taskId: "task-1",
        fromColumn: "ready",
        toColumn: "qa",
        confirmed: false,
      }),
    ).toThrow();
  });

  it("decodes git file actions and diffs for Phase 6", () => {
    expect(
      decodeGitFileActionRequest({
        repoId: "repo-1",
        cwd: "/tmp/kanban-console",
        paths: ["apps/web/src/routes/kanban.tsx"],
        confirmed: true,
      }),
    ).toMatchObject({ paths: ["apps/web/src/routes/kanban.tsx"] });

    expect(
      decodeGitFileDiff({
        repoId: "repo-1",
        path: "apps/web/src/routes/kanban.tsx",
        status: "unstaged",
        diff: "diff --git a/apps/web/src/routes/kanban.tsx b/apps/web/src/routes/kanban.tsx",
        truncated: false,
      }),
    ).toMatchObject({ status: "unstaged", truncated: false });
  });

  it("rejects empty git file action path lists", () => {
    expect(() =>
      decodeGitFileActionRequest({
        repoId: "repo-1",
        cwd: "/tmp/kanban-console",
        paths: [],
        confirmed: true,
      }),
    ).toThrow();
  });

  it("decodes product artifact read and guarded write contracts", () => {
    expect(
      decodeArtifactContent({
        repoId: "repo-1",
        path: "docs/product/project-console.md",
        title: "Project Console",
        status: "clean",
        updatedAt: "2026-05-06T12:00:00.000Z",
        content: "# Project Console\n\nSynthetic product note.",
        preview: "Project Console\nSynthetic product note.",
      }),
    ).toMatchObject({ title: "Project Console", status: "clean" });

    expect(
      decodeArtifactWriteRequest({
        repoId: "repo-1",
        cwd: "/tmp/kanban-console",
        path: "docs/product/project-console.md",
        content: "# Project Console\n",
        confirmed: true,
        linkedRepository: "MohAnghabo/kanban-console",
        linkedIssueNumber: 43,
      }),
    ).toMatchObject({ confirmed: true, linkedIssueNumber: 43 });

    expect(
      decodeArtifactWriteResult({
        repoId: "repo-1",
        path: "docs/product/project-console.md",
        status: "applied",
        message: "Artifact updated.",
        commentTarget: "issue#43",
      }),
    ).toMatchObject({ status: "applied", commentTarget: "issue#43" });
  });

  it("decodes PR watcher signals, prompts, and sticky action comments", () => {
    expect(
      decodeSnapshot({
        version: 1,
        generatedAt: "2026-05-06T13:30:00.000Z",
        locale: "en",
        repos: [],
        boards: [],
        tasks: [],
        prWatches: [
          {
            id: "watch-pr-14",
            repo: "kanban-console",
            pr: "kanban-console#14",
            title: "Phase 7 artifacts",
            taskId: "task-1",
            pollingIntervalSeconds: 60,
            actionCommentPolicy: "sticky",
            checks: [{ id: "validate", name: "Validate", status: "failing" }],
            reviewSignals: [
              {
                id: "signal-validate",
                kind: "ci-failure",
                sourceKind: "check-run",
                source: "GitHub Actions",
                summary: "Validate failed.",
                fingerprint: "check-run:validate:failure",
                trusted: true,
                duplicateSuppressed: false,
                createdAt: "2026-05-06T13:31:00.000Z",
              },
              {
                id: "signal-review",
                kind: "review-comment",
                sourceKind: "review-comment",
                source: "coderabbitai",
                summary: "Review comment requires attention.",
                fingerprint: "review-comment:coderabbitai:abc",
                trusted: true,
                duplicateSuppressed: true,
                createdAt: "2026-05-06T13:32:00.000Z",
              },
            ],
            lastSeenAt: "2026-05-06T13:33:00.000Z",
          },
        ],
        suggestedFixes: [
          {
            id: "fix-validate",
            taskId: "task-1",
            prWatchId: "watch-pr-14",
            title: "Inspect failing Validate check",
            command: "/ship t3-kanban-project-console",
            status: "eligible",
            guardrails: ["requires-confirmation", "redact-logs"],
            prompt: "Inspect the failing Validate check and propose a minimal fix.",
            sourceSignalIds: ["signal-validate"],
          },
        ],
        commandRuns: [],
        gitStatuses: [],
        artifacts: [],
        gitOpsPolicy: {
          protectedBranches: ["main"],
          allowedWorkBranchPrefixes: ["feature/"],
          destructiveActionsRequireSecondConfirmation: true,
        },
        releaseReadiness: {
          branch: "release/test",
          gates: [],
        },
        agentWorkflows: [],
      }),
    ).toMatchObject({
      prWatches: [{ pollingIntervalSeconds: 60, actionCommentPolicy: "sticky" }],
      suggestedFixes: [{ sourceSignalIds: ["signal-validate"] }],
    });

    expect(
      decodeSuggestedFix({
        id: "fix-review",
        taskId: "task-1",
        prWatchId: "watch-pr-14",
        title: "Address trusted review comment",
        command: "/review",
        status: "needs-confirmation",
        guardrails: ["trusted-review", "requires-confirmation"],
        prompt: "Address the trusted review comment without launching auto-fix.",
        sourceSignalIds: ["signal-review"],
      }),
    ).toMatchObject({ status: "needs-confirmation" });

    expect(
      decodePrWatchActionComment({
        id: "action-watch-pr-14",
        prWatchId: "watch-pr-14",
        policy: "sticky",
        body: "Kanban Console PR watcher update",
        materialStateChanged: true,
        duplicateSuppressed: false,
        updatedAt: "2026-05-06T13:34:00.000Z",
      }),
    ).toMatchObject({ policy: "sticky" });
  });

  it("decodes gated auto-fix runs with budgets, gates, and validation commands", () => {
    const decoded = decodeAutoFixRun({
      id: "autofix-fix-validate",
      taskId: "task-1",
      suggestedFixId: "fix-validate",
      prWatchId: "watch-pr-14",
      command: "/ship t3-kanban-project-console",
      status: "queued",
      fingerprint: "check-run:1:failing",
      branch: "feature/t3-kanban-phase-9-gated-autofix",
      attemptsUsed: 1,
      maxAttempts: 2,
      validationCommands: ["bun check"],
      gates: [
        {
          id: "trusted-source",
          kind: "trusted-source",
          status: "pass",
          message: "All source signals are trusted.",
        },
        {
          id: "branch-policy",
          kind: "branch-policy",
          status: "pass",
          message: "Branch is eligible for auto-fix.",
        },
      ],
      sourceSignalIds: ["signal-validate"],
      sessionId: "agent-task-1-autofix",
      summary: "Auto-fix queued behind validation gates.",
      updatedAt: "2026-05-07T02:00:00.000Z",
    });

    expect(decoded).toMatchObject({
      status: "queued",
      validationCommands: ["bun check"],
    });
    expect(decoded.gates).toContainEqual(expect.objectContaining({ kind: "trusted-source" }));
  });

  it("decodes CLI adapter audit and execution result contracts", () => {
    const audit = decodeCliAuditRecord({
      id: "cli-audit-gh-1",
      tool: "gh",
      command: "gh",
      args: ["api", "repos/MohAnghabo/kanban-console"],
      cwd: "/tmp/kanban-console",
      status: "succeeded",
      mutates: false,
      confirmed: false,
      startedAt: "2026-05-07T08:00:00.000Z",
      completedAt: "2026-05-07T08:00:01.000Z",
      durationMs: 1000,
      exitCode: 0,
      stdoutTruncated: false,
      stderrTruncated: false,
    });

    expect(audit).toMatchObject({ tool: "gh", status: "succeeded" });
    expect(
      decodeCliExecutionResult({
        tool: "gh",
        exitCode: 0,
        stdout: '{"name":"kanban-console"}',
        stderr: "",
        audit,
      }),
    ).toMatchObject({ tool: "gh", audit: { command: "gh" } });
  });
});
