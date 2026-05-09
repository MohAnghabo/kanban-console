// @effect-diagnostics globalDateInEffect:off
// @effect-diagnostics importFromBarrel:off
// Tests pass fixed Date values into public provider options to verify deterministic output.
import { afterEach, assert, describe, expect, it, vi } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ChildProcessSpawner } from "effect/unstable/process";
import type {
  KanbanConsoleAutoFixPolicy,
  KanbanConsoleReviewSignal,
  KanbanConsoleSuggestedFix,
} from "@t3tools/contracts";

import * as GitHubCli from "../sourceControl/GitHubCli.ts";
import type * as VcsProcess from "../vcs/VcsProcess.ts";
import * as GatedAutoFixProvider from "./GatedAutoFixProvider.ts";

const processOutput = (stdout: string): VcsProcess.VcsProcessOutput => ({
  exitCode: ChildProcessSpawner.ExitCode(0),
  stdout,
  stderr: "",
  stdoutTruncated: false,
  stderrTruncated: false,
});

const execute = vi.fn<GitHubCli.GitHubCliShape["execute"]>();

const layer = GatedAutoFixProvider.layer.pipe(
  Layer.provide(
    Layer.mock(GitHubCli.GitHubCli)({
      execute,
      listOpenPullRequests: vi.fn(),
      getPullRequest: vi.fn(),
      getRepositoryCloneUrls: vi.fn(),
      createRepository: vi.fn(),
      createPullRequest: vi.fn(),
      getDefaultBranch: vi.fn(),
      checkoutPullRequest: vi.fn(),
    }),
  ),
);

const policy: KanbanConsoleAutoFixPolicy = {
  trustedSources: ["GitHub Actions", "coderabbitai"],
  maxAttemptsPerFingerprint: 2,
  pauseLabels: ["ai-fix:paused"],
  protectedBranches: ["main", "release/*"],
  allowedBranchPrefixes: ["feature/", "fix/"],
  requiredValidationCommands: ["bun check"],
  aiLoopCredentialsConfigured: true,
};

const signal: KanbanConsoleReviewSignal = {
  id: "signal-validate",
  kind: "ci-failure",
  sourceKind: "check-run",
  source: "GitHub Actions",
  summary: "Validate is failing.",
  fingerprint: "check-run:1:failing",
  trusted: true,
  duplicateSuppressed: false,
  createdAt: "2026-05-07T02:00:00.000Z",
};

const suggestedFix: KanbanConsoleSuggestedFix = {
  id: "fix-validate",
  taskId: "t3-kanban-project-console",
  prWatchId: "watch-pr-18",
  title: "Inspect failing check",
  command: "/ship t3-kanban-project-console",
  status: "eligible",
  guardrails: ["requires-confirmation", "trusted-source"],
  prompt: "Inspect the failing check.",
  sourceSignalIds: [signal.id],
};

afterEach(() => {
  execute.mockReset();
});

describe("GatedAutoFixProvider", () => {
  it.effect("queues trusted auto-fix behind budget, branch, credential, and validation gates", () =>
    Effect.gen(function* () {
      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const run = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy,
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        confirmed: true,
        now: new Date("2026-05-07T02:01:00.000Z"),
      });
      const session = provider.queueSession(run);

      assert.equal(run.status, "queued");
      assert.equal(run.fingerprint, signal.fingerprint);
      assert.equal(run.attemptsUsed, 1);
      assert.equal(run.command, suggestedFix.command);
      assert.equal(run.validationCommands[0], "bun check");
      assert.equal(
        run.gates.every((gate) => gate.status === "pass"),
        true,
      );
      assert.equal(session.status, "queued");
      expect(session.command).toBe("/ship t3-kanban-project-console");
    }).pipe(Effect.provide(layer)),
  );

  it.effect("blocks untrusted sources before queueing auto-fix", () =>
    Effect.gen(function* () {
      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const run = provider.evaluate({
        suggestedFix,
        reviewSignals: [{ ...signal, trusted: false, source: "unknown-reviewer" }],
        policy,
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        confirmed: true,
      });

      assert.equal(run.status, "blocked");
      expect(run.gates.find((gate) => gate.kind === "trusted-source")).toMatchObject({
        status: "blocked",
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("exhausts auto-fix when the fingerprint budget is spent", () =>
    Effect.gen(function* () {
      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const run = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy,
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        previousAttempts: [{ fingerprint: signal.fingerprint, attemptsUsed: 2, maxAttempts: 2 }],
        confirmed: true,
      });

      assert.equal(run.status, "exhausted");
      assert.equal(run.attemptsUsed, 2);
      expect(run.gates.find((gate) => gate.kind === "attempt-budget")).toMatchObject({
        status: "blocked",
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("blocks paused labels and protected branches", () =>
    Effect.gen(function* () {
      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const paused = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy,
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        labels: ["ai-fix:paused"],
        confirmed: true,
      });
      const protectedBranch = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy,
        branch: "release/stable",
        confirmed: true,
      });

      assert.equal(paused.status, "blocked");
      assert.equal(protectedBranch.status, "blocked");
      expect(paused.gates.find((gate) => gate.kind === "pause-label")).toMatchObject({
        status: "blocked",
      });
      expect(protectedBranch.gates.find((gate) => gate.kind === "branch-policy")).toMatchObject({
        status: "blocked",
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("blocks auto-fix when validation commands are not configured", () =>
    Effect.gen(function* () {
      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const run = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy: { ...policy, requiredValidationCommands: [] },
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        confirmed: true,
      });

      assert.equal(run.status, "blocked");
      expect(run.gates.find((gate) => gate.kind === "validation")).toMatchObject({
        status: "blocked",
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("surfaces missing ai-loop credentials as setup-required", () =>
    Effect.gen(function* () {
      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const run = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy: { ...policy, aiLoopCredentialsConfigured: false },
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        confirmed: true,
      });

      assert.equal(run.status, "setup-required");
      expect(run.summary).toContain("AI-loop credentials are missing");
    }).pipe(Effect.provide(layer)),
  );

  it.effect("posts concise PR comments for auto-fix lifecycle states", () =>
    Effect.gen(function* () {
      execute.mockReturnValueOnce(Effect.succeed(processOutput("https://github.com/comment\n")));

      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const run = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy,
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        confirmed: true,
      });

      yield* provider.postRunComment({
        cwd: "/repo",
        repository: "MohAnghabo/kanban-console",
        pullRequestNumber: 18,
        run,
        confirmed: true,
      });

      const body = execute.mock.calls[0]?.[0].args.at(-1);
      expect(body).toContain("Kanban Console auto-fix queued.");
      expect(body).toContain("Raw command output is intentionally omitted.");
      expect(execute).toHaveBeenCalledWith({
        cwd: "/repo",
        args: ["pr", "comment", "18", "--repo", "MohAnghabo/kanban-console", "--body", body],
        timeoutMs: 30_000,
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("rejects auto-fix PR comments without explicit confirmation", () =>
    Effect.gen(function* () {
      const provider = yield* GatedAutoFixProvider.GatedAutoFixProvider;
      const run = provider.evaluate({
        suggestedFix,
        reviewSignals: [signal],
        policy,
        branch: "feature/t3-kanban-phase-9-gated-autofix",
        confirmed: true,
      });

      const error = yield* provider
        .postRunComment({
          cwd: "/repo",
          repository: "MohAnghabo/kanban-console",
          pullRequestNumber: 18,
          run,
          confirmed: false,
        })
        .pipe(Effect.flip);

      expect(error).toBeInstanceOf(GatedAutoFixProvider.GatedAutoFixProviderError);
      expect(execute).not.toHaveBeenCalled();
    }).pipe(Effect.provide(layer)),
  );
});
