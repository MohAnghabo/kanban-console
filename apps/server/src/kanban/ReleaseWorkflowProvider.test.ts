import { afterEach, assert, describe, expect, it, vi } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ChildProcessSpawner } from "effect/unstable/process";
import type { KanbanConsoleGitOpsPolicy, KanbanConsoleReleaseReadiness } from "@t3tools/contracts";

import * as GitHubCli from "../sourceControl/GitHubCli.ts";
import type * as VcsProcess from "../vcs/VcsProcess.ts";
import * as ReleaseWorkflowProvider from "./ReleaseWorkflowProvider.ts";

const processOutput = (stdout: string): VcsProcess.VcsProcessOutput => ({
  exitCode: ChildProcessSpawner.ExitCode(0),
  stdout,
  stderr: "",
  stdoutTruncated: false,
  stderrTruncated: false,
});

const execute = vi.fn<GitHubCli.GitHubCliShape["execute"]>();

const layer = ReleaseWorkflowProvider.layer.pipe(
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

const policy: KanbanConsoleGitOpsPolicy = {
  protectedBranches: ["main", "release/*"],
  allowedWorkBranchPrefixes: ["feature/", "fix/"],
  destructiveActionsRequireSecondConfirmation: true,
};

const releaseSecretCorpus = [
  "ghp_1234567890abcdef",
  "github_pat_1234567890abcdef",
  "doppler_1234567890abcdef",
  "sk-1234567890abcdef",
  "xoxb-1234567890abcdef",
  "TOKEN=release-secret",
  "OPENAI_API_KEY=sk-1234567890abcdef",
] as const;

const passingBase: KanbanConsoleReleaseReadiness = {
  branch: "release/v1.0.0",
  latestTag: "v0.9.0",
  targetTag: "v1.0.0",
  gates: [
    { id: "gate-release-branch", label: "Release branch", status: "passing" },
    { id: "gate-clean-worktree", label: "Clean worktree", status: "passing" },
    { id: "gate-tag-readiness", label: "Tag readiness", status: "passing" },
  ],
};

afterEach(() => {
  execute.mockReset();
});

describe("ReleaseWorkflowProvider", () => {
  it.effect(
    "builds an eligible release workflow from PRs, issues, artifacts, checks, and providers",
    () =>
      Effect.gen(function* () {
        const provider = yield* ReleaseWorkflowProvider.ReleaseWorkflowProvider;
        const readiness = provider.build({
          base: passingBase,
          policy,
          issues: [
            {
              id: "issue-43",
              source: "issue",
              title: "Complete release workflow",
              url: "https://github.com/MohAnghabo/kanban-console/issues/43",
            },
          ],
          pullRequests: [
            {
              id: "pr-22",
              source: "pull-request",
              title: "Add CLI adapters",
              url: "https://github.com/MohAnghabo/kanban-console/pull/22",
            },
          ],
          artifacts: [
            {
              id: "artifact-release-notes",
              repoId: "repo-kanban",
              path: "docs/product/release-notes.md",
              title: "Release notes",
              status: "clean",
              updatedAt: "2026-05-07T08:00:00.000Z",
            },
          ],
          requiredChecks: [
            { id: "check-validate", name: "Validate", status: "passing" },
            { id: "check-smoke", name: "Release Smoke", status: "passing" },
          ],
          reviewState: {
            status: "approved",
            approvals: 2,
            changesRequested: 0,
            pendingReviewers: 0,
          },
          deploymentProviders: [
            { id: "vercel", label: "Vercel", status: "passing", detail: "Preview ready" },
            { id: "render", label: "Render", status: "passing", detail: "Deploy hook ready" },
          ],
          actionTarget: { repository: "MohAnghabo/kanban-console", number: 22 },
          now: new Date("2026-05-07T08:01:00.000Z"),
        });

        assert.equal(
          readiness.gates.every((gate) => gate.status === "passing"),
          true,
        );
        assert.equal(readiness.notes?.length, 3);
        assert.equal(readiness.requiredChecks?.length, 2);
        assert.equal(readiness.reviewState?.status, "approved");
        assert.equal(readiness.deploymentProviders?.length, 2);
        expect(readiness.actionComment).toMatchObject({
          target: "MohAnghabo/kanban-console#22",
        });
        expect(JSON.stringify(readiness)).not.toContain("ghp_");
      }).pipe(Effect.provide(layer)),
  );

  it.effect(
    "blocks release workflow when branch, checks, review, provider, or tag readiness fails",
    () =>
      Effect.gen(function* () {
        const provider = yield* ReleaseWorkflowProvider.ReleaseWorkflowProvider;
        const readiness = provider.build({
          base: {
            ...passingBase,
            branch: "feature/not-release",
            gates: [{ id: "gate-tag-readiness", label: "Tag readiness", status: "blocked" }],
          },
          policy,
          issues: [{ id: "issue-1", source: "issue", title: "Do not leak TOKEN=secret-value" }],
          requiredChecks: [{ id: "check-validate", name: "Validate", status: "failing" }],
          reviewState: {
            status: "changes-requested",
            approvals: 0,
            changesRequested: 1,
            pendingReviewers: 0,
          },
          deploymentProviders: [{ id: "vercel", label: "Vercel", status: "blocked" }],
        });

        expect(readiness.gates.map((gate) => [gate.id, gate.status])).toContainEqual([
          "gate-release-branch-policy",
          "blocked",
        ]);
        expect(readiness.gates.map((gate) => [gate.id, gate.status])).toContainEqual([
          "gate-required-checks",
          "blocked",
        ]);
        expect(readiness.notes?.[0]?.title).toBe("Do not leak [redacted]");
        expect(readiness.actions?.every((action) => action.status === "blocked")).toBe(true);
      }).pipe(Effect.provide(layer)),
  );

  it.effect("recomputes generated release gates when prior enriched readiness is reused", () =>
    Effect.gen(function* () {
      const provider = yield* ReleaseWorkflowProvider.ReleaseWorkflowProvider;
      const previouslyReady = provider.build({
        base: passingBase,
        policy,
        issues: [{ id: "issue-43", source: "issue", title: "Prepare release" }],
        requiredChecks: [{ id: "check-validate", name: "Validate", status: "passing" }],
        reviewState: {
          status: "approved",
          approvals: 1,
          changesRequested: 0,
          pendingReviewers: 0,
        },
        deploymentProviders: [{ id: "vercel", label: "Vercel", status: "passing" }],
      });
      const recomputed = provider.build({
        base: previouslyReady,
        policy,
        issues: [{ id: "issue-43", source: "issue", title: "Prepare release" }],
        requiredChecks: [{ id: "check-validate", name: "Validate", status: "failing" }],
        reviewState: {
          status: "changes-requested",
          approvals: 0,
          changesRequested: 1,
          pendingReviewers: 0,
        },
        deploymentProviders: [{ id: "vercel", label: "Vercel", status: "blocked" }],
      });

      expect(recomputed.gates.find((gate) => gate.id === "gate-required-checks")).toMatchObject({
        status: "blocked",
      });
      expect(recomputed.gates.find((gate) => gate.id === "gate-review-state")).toMatchObject({
        status: "blocked",
      });
      expect(
        recomputed.gates.find((gate) => gate.id === "gate-deployment-providers"),
      ).toMatchObject({ status: "blocked" });
      expect(recomputed.actions?.every((action) => action.status === "blocked")).toBe(true);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("posts release preparation comments only after explicit confirmation", () =>
    Effect.gen(function* () {
      execute.mockReturnValueOnce(Effect.succeed(processOutput("posted")));
      const provider = yield* ReleaseWorkflowProvider.ReleaseWorkflowProvider;
      const readiness = provider.build({
        base: passingBase,
        policy,
        issues: [{ id: "issue-43", source: "issue", title: "Prepare release" }],
        requiredChecks: [{ id: "check-validate", name: "Validate", status: "passing" }],
        reviewState: {
          status: "approved",
          approvals: 1,
          changesRequested: 0,
          pendingReviewers: 0,
        },
        deploymentProviders: [{ id: "vercel", label: "Vercel", status: "passing" }],
      });

      const blocked = yield* provider.postPreparationComment({
        cwd: "/repo",
        readiness,
        request: {
          kind: "prepare-comment",
          repository: "MohAnghabo/kanban-console",
          targetNumber: 22,
          confirmed: false,
        },
      });
      const posted = yield* provider.postPreparationComment({
        cwd: "/repo",
        readiness,
        request: {
          kind: "prepare-comment",
          repository: "MohAnghabo/kanban-console",
          targetNumber: 22,
          confirmed: true,
        },
      });

      assert.equal(blocked.status, "blocked");
      assert.equal(posted.status, "commented");
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining(["issue", "comment", "22"]),
        }),
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect("redacts caller-provided release readiness fields before posting comments", () =>
    Effect.gen(function* () {
      execute.mockReturnValueOnce(Effect.succeed(processOutput("posted")));
      const provider = yield* ReleaseWorkflowProvider.ReleaseWorkflowProvider;
      const readiness: KanbanConsoleReleaseReadiness = {
        branch: "release/TOKEN=branch-secret",
        latestTag: "v1.0.0-ghp_1234567890abcdef",
        targetTag: "v1.1.0 SECRET=tag-secret",
        gates: [
          {
            id: "gate-custom",
            label: "Gate with github_pat_1234567890abcdef",
            status: "passing",
          },
        ],
        notes: [
          {
            id: "note-secret",
            source: "issue",
            title: "Do not leak PASSWORD=note-secret",
          },
        ],
        deploymentProviders: [
          {
            id: "provider-secret",
            label: "Provider sk-1234567890abcdef",
            status: "passing",
          },
        ],
      };

      yield* provider.postPreparationComment({
        cwd: "/repo",
        readiness,
        request: {
          kind: "prepare-comment",
          repository: "MohAnghabo/kanban-console",
          targetNumber: 22,
          confirmed: true,
        },
      });

      const bodyArg = execute.mock.calls[0]?.[0].args.at(-1);
      expect(bodyArg).toContain("[redacted]");
      expect(bodyArg).not.toContain("branch-secret");
      expect(bodyArg).not.toContain("ghp_1234567890abcdef");
      expect(bodyArg).not.toContain("tag-secret");
      expect(bodyArg).not.toContain("github_pat_1234567890abcdef");
      expect(bodyArg).not.toContain("note-secret");
      expect(bodyArg).not.toContain("sk-1234567890abcdef");
    }).pipe(Effect.provide(layer)),
  );

  it("redacts the release secret corpus from generated preparation comments", () => {
    for (const secret of releaseSecretCorpus) {
      const body = ReleaseWorkflowProvider.releasePreparationCommentBody({
        branch: `release/${secret}`,
        latestTag: `v1.0.0-${secret}`,
        targetTag: `v1.1.0-${secret}`,
        gates: [{ id: `gate-${secret}`, label: `Gate ${secret}`, status: "passing" }],
        notes: [{ id: `note-${secret}`, source: "issue", title: `Note ${secret}` }],
        deploymentProviders: [
          { id: `provider-${secret}`, label: `Provider ${secret}`, status: "passing" },
        ],
      });

      expect(body).toContain("[redacted]");
      expect(body).not.toContain(secret);
    }
  });

  it.effect("captures merge, deploy, and tag confirmations without executing those actions", () =>
    Effect.gen(function* () {
      const provider = yield* ReleaseWorkflowProvider.ReleaseWorkflowProvider;
      const readiness = provider.build({
        base: passingBase,
        policy,
        issues: [{ id: "issue-43", source: "issue", title: "Prepare release" }],
        requiredChecks: [{ id: "check-validate", name: "Validate", status: "passing" }],
        reviewState: {
          status: "approved",
          approvals: 1,
          changesRequested: 0,
          pendingReviewers: 0,
        },
        deploymentProviders: [{ id: "vercel", label: "Vercel", status: "passing" }],
      });
      const merge = provider.evaluateAction(readiness, {
        kind: "merge",
        repository: "MohAnghabo/kanban-console",
        targetNumber: 22,
        confirmed: true,
        secondConfirmed: true,
      });

      assert.equal(merge.status, "ready");
      expect(merge.message).toContain("not performed by Phase 11");
      expect(execute).not.toHaveBeenCalled();
    }).pipe(Effect.provide(layer)),
  );

  it.effect("honors policy when destructive actions do not require second confirmation", () =>
    Effect.gen(function* () {
      const provider = yield* ReleaseWorkflowProvider.ReleaseWorkflowProvider;
      const readiness = provider.build({
        base: passingBase,
        policy: {
          ...policy,
          destructiveActionsRequireSecondConfirmation: false,
        },
        issues: [{ id: "issue-43", source: "issue", title: "Prepare release" }],
        requiredChecks: [{ id: "check-validate", name: "Validate", status: "passing" }],
        reviewState: {
          status: "approved",
          approvals: 1,
          changesRequested: 0,
          pendingReviewers: 0,
        },
        deploymentProviders: [{ id: "vercel", label: "Vercel", status: "passing" }],
      });

      const merge = provider.evaluateAction(readiness, {
        kind: "merge",
        repository: "MohAnghabo/kanban-console",
        targetNumber: 22,
        confirmed: true,
      });

      assert.equal(merge.status, "ready");
      assert.equal(merge.requiresSecondConfirmation, false);
    }).pipe(Effect.provide(layer)),
  );
});
