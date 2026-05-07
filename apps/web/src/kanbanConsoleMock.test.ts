import { describe, expect, it } from "vitest";

import {
  getLocaleDirection,
  getMessages,
  getPrWatchHealth,
  getTasksByColumn,
  isSuggestedFixEligible,
  kanbanConsoleMockProvider,
  kanbanConsoleMessages,
  kanbanTasks,
  moveTaskToColumn,
  previewTaskTransition,
  type KanbanColumnId,
} from "./kanbanConsoleMock";

describe("kanbanConsoleMock", () => {
  it("keeps Arabic and English message keys aligned", () => {
    expect(Object.keys(kanbanConsoleMessages.ar).toSorted()).toEqual(
      Object.keys(kanbanConsoleMessages.en).toSorted(),
    );
  });

  it("resolves locale direction for RTL checks", () => {
    expect(getLocaleDirection("en")).toBe("ltr");
    expect(getLocaleDirection("ar")).toBe("rtl");
  });

  it("groups every mock task into one board column", () => {
    const groupedTaskIds = getTasksByColumn()
      .flatMap((column) => column.tasks)
      .map((task) => task.id)
      .toSorted();

    expect(groupedTaskIds).toEqual(kanbanTasks.map((task) => task.id).toSorted());
  });

  it("moves a task without mutating other cards", () => {
    const [targetTask, untouchedTask] = kanbanTasks;
    expect(targetTask).toBeDefined();
    expect(untouchedTask).toBeDefined();

    if (!targetTask || !untouchedTask) {
      throw new Error("mock task fixture is incomplete");
    }

    const nextColumn: KanbanColumnId = "review";
    const movedTasks = moveTaskToColumn(kanbanTasks, targetTask.id, nextColumn);

    expect(movedTasks.find((task) => task.id === targetTask.id)?.column).toBe(nextColumn);
    expect(movedTasks.find((task) => task.id === untouchedTask.id)).toEqual(untouchedTask);
    expect(kanbanTasks[0]?.column).not.toBe(nextColumn);
  });

  it("returns locale-specific labels", () => {
    expect(getMessages("en").consoleTitle).toBe("Kanban Project Console");
    expect(getMessages("ar").consoleTitle).toBe("وحدة تحكم مشروع كانبان");
  });

  it("previews Kanban transitions before mutating external state", () => {
    const targetTask = kanbanTasks[0];
    expect(targetTask).toBeDefined();

    if (!targetTask) {
      throw new Error("mock task fixture is incomplete");
    }

    expect(
      previewTaskTransition({
        taskId: targetTask.id,
        fromColumn: targetTask.column,
        toColumn: "done",
        confirmed: false,
      }),
    ).toMatchObject({
      action: "open-action-sheet",
      requiresConfirmation: true,
    });

    expect(
      previewTaskTransition({
        taskId: targetTask.id,
        fromColumn: targetTask.column,
        toColumn: targetTask.column,
        confirmed: true,
      }),
    ).toMatchObject({
      action: "none",
      duplicateSuppressed: true,
    });
  });

  it("classifies PR watch health from check runs", () => {
    const watches = kanbanConsoleMockProvider.listPrWatches();

    expect(watches.map((watch) => getPrWatchHealth(watch))).toEqual(["pending", "attention"]);
  });

  it("gates suggested auto-fixes with guardrails", () => {
    const fixes = kanbanConsoleMockProvider.listSuggestedFixes();

    expect(fixes.map((fix) => isSuggestedFixEligible(fix))).toEqual([true, false]);
  });

  it("exposes Phase 8 PR watcher policy, signals, and suggested prompts", () => {
    const snapshot = kanbanConsoleMockProvider.readSnapshot();
    const failingWatch = snapshot.prWatches.find((watch) =>
      watch.checks.some((check) => check.status === "failing"),
    );

    expect(failingWatch).toMatchObject({
      pollingIntervalSeconds: 60,
      actionCommentPolicy: "sticky",
    });
    expect(failingWatch?.reviewSignals.some((signal) => signal.sourceKind === "check-run")).toBe(
      true,
    );
    expect(failingWatch?.reviewSignals.some((signal) => signal.duplicateSuppressed === true)).toBe(
      true,
    );
    expect(snapshot.suggestedFixes.some((fix) => fix.prompt?.includes("smallest safe fix"))).toBe(
      true,
    );
  });

  it("exposes mock agent sessions and workflow recipes for card actions", () => {
    const snapshot = kanbanConsoleMockProvider.readSnapshot();
    const sessions = kanbanConsoleMockProvider.listAgentSessions();

    expect(snapshot.agentWorkflows.map((workflow) => workflow.commandId)).toEqual([
      "phase",
      "ship",
      "orchestrate",
      "review",
    ]);
    expect(sessions.map((session) => session.status)).toEqual(["queued", "blocked"]);
    expect(kanbanTasks.some((task) => task.agentSessionStatus === "queued")).toBe(true);
  });

  it("exposes gated auto-fix run states in the mock snapshot", () => {
    const runs = kanbanConsoleMockProvider.listAutoFixRuns();
    const [run] = runs;

    expect(run).toMatchObject({
      status: "setup-required",
      command: "/ship t3-kanban-project-console",
      validationCommands: ["bun check"],
      attemptsUsed: 0,
      maxAttempts: 2,
    });
    expect(
      run?.gates.some((gate) => gate.kind === "ai-loop-credentials" && gate.status === "blocked"),
    ).toBe(true);
    expect(kanbanConsoleMockProvider.readSnapshot().autoFixRuns).toEqual(runs);
  });

  it("exposes Phase 6 GitOps status details in the mock snapshot", () => {
    const [status] = kanbanConsoleMockProvider.readSnapshot().gitStatuses;

    expect(status).toMatchObject({
      repoId: "repo-kanban-console",
      isRepo: true,
      aheadOfDefault: 1,
    });
    expect(status?.files.map((file) => file.status).toSorted()).toEqual([
      "staged",
      "unstaged",
      "untracked",
    ]);
    expect(status?.files.some((file) => file.hunkStaging === "supported")).toBe(true);
    expect(status?.policyViolations?.map((violation) => violation.kind)).toContain(
      "missing-upstream",
    );
    expect(kanbanConsoleMockProvider.readSnapshot().releaseReadiness).toMatchObject({
      latestTag: "v0.4.0",
      targetTag: "v0.5.0",
    });
    expect(
      kanbanConsoleMockProvider
        .readSnapshot()
        .releaseReadiness.gates.some((gate) => gate.id === "gate-tag-readiness"),
    ).toBe(true);
  });
});
