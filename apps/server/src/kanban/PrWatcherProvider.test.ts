import { afterEach, assert, describe, expect, it, vi } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ChildProcessSpawner } from "effect/unstable/process";

import * as GitHubCli from "../sourceControl/GitHubCli.ts";
import type * as VcsProcess from "../vcs/VcsProcess.ts";
import * as PrWatcherProvider from "./PrWatcherProvider.ts";

const processOutput = (stdout: string): VcsProcess.VcsProcessOutput => ({
  exitCode: ChildProcessSpawner.ExitCode(0),
  stdout,
  stderr: "",
  stdoutTruncated: false,
  stderrTruncated: false,
});

const execute = vi.fn<GitHubCli.GitHubCliShape["execute"]>();

const layer = PrWatcherProvider.layer.pipe(
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

function prViewFixture(input?: {
  readonly checkConclusion?: string | null;
  readonly checkStatus?: string;
  readonly reviews?: ReadonlyArray<unknown>;
}) {
  return {
    number: 14,
    title: "Phase 7 product artifacts",
    url: "https://github.com/MohAnghabo/kanban-console/pull/14",
    updatedAt: "2026-05-06T20:41:00.000Z",
    statusCheckRollup: [
      {
        databaseId: 1,
        name: "Validate",
        status: input?.checkStatus ?? "COMPLETED",
        conclusion: input?.checkConclusion === undefined ? "FAILURE" : input.checkConclusion,
        detailsUrl: "https://github.com/MohAnghabo/kanban-console/actions/runs/1",
      },
    ],
    reviews: input?.reviews ?? [],
  };
}

function issueViewFixture(comments: ReadonlyArray<unknown> = []) {
  return { comments };
}

function mockGhResponses(
  pr: unknown,
  reviewCommentPages: ReadonlyArray<unknown> = [],
  issue: unknown = issueViewFixture(),
  linkedIssue?: unknown,
) {
  execute
    .mockReturnValueOnce(Effect.succeed(processOutput(JSON.stringify(pr))))
    .mockReturnValueOnce(Effect.succeed(processOutput(JSON.stringify(reviewCommentPages))))
    .mockReturnValueOnce(Effect.succeed(processOutput(JSON.stringify(issue))));
  if (linkedIssue) {
    execute.mockReturnValueOnce(Effect.succeed(processOutput(JSON.stringify(linkedIssue))));
  }
}

afterEach(() => {
  execute.mockReset();
});

describe("PrWatcherProvider", () => {
  it.effect("polls checks and suggests a fix for CI failure signals", () =>
    Effect.gen(function* () {
      mockGhResponses(prViewFixture());

      const provider = yield* PrWatcherProvider.PrWatcherProvider;
      const result = yield* provider.readWatch({
        cwd: "/repo",
        repository: "MohAnghabo/kanban-console",
        prNumber: 14,
        taskId: "task-1",
        now: "2026-05-06T20:42:00.000Z",
      });

      assert.equal(result.watch.pollingIntervalSeconds, 60);
      assert.equal(result.watch.actionCommentPolicy, "sticky");
      assert.equal(result.watch.checks[0]?.status, "failing");
      assert.equal(result.watch.reviewSignals[0]?.kind, "ci-failure");
      assert.equal(result.suggestedFixes[0]?.status, "eligible");
      assert.equal(result.suggestedFixes[0]?.guardrails.includes("redact-logs"), true);
      assert.equal(result.actionComment.materialStateChanged, true);
      expect(execute).toHaveBeenNthCalledWith(1, {
        cwd: "/repo",
        args: [
          "pr",
          "view",
          "14",
          "--repo",
          "MohAnghabo/kanban-console",
          "--json",
          "number,title,url,statusCheckRollup,reviews,updatedAt",
        ],
        timeoutMs: 30_000,
      });
      expect(execute).toHaveBeenNthCalledWith(2, {
        cwd: "/repo",
        args: ["api", "repos/MohAnghabo/kanban-console/pulls/14/comments", "--paginate", "--slurp"],
        timeoutMs: 30_000,
      });
      expect(execute).toHaveBeenNthCalledWith(3, {
        cwd: "/repo",
        args: [
          "issue",
          "view",
          "14",
          "--repo",
          "MohAnghabo/kanban-console",
          "--comments",
          "--json",
          "comments",
        ],
        timeoutMs: 30_000,
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("represents CI recovery without generating suggested fixes", () =>
    Effect.gen(function* () {
      mockGhResponses(prViewFixture({ checkConclusion: "SUCCESS" }));

      const provider = yield* PrWatcherProvider.PrWatcherProvider;
      const result = yield* provider.readWatch({
        cwd: "/repo",
        repository: "MohAnghabo/kanban-console",
        prNumber: 14,
        taskId: "task-1",
      });

      assert.equal(result.watch.checks[0]?.status, "passing");
      assert.equal(result.watch.reviewSignals.length, 0);
      assert.equal(result.suggestedFixes.length, 0);
      assert.equal(result.actionComment.materialStateChanged, false);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("classifies trusted review and issue comments", () =>
    Effect.gen(function* () {
      mockGhResponses(
        prViewFixture({
          checkConclusion: "SUCCESS",
          reviews: [
            {
              author: { login: "coderabbitai" },
              state: "CHANGES_REQUESTED",
              submittedAt: "2026-05-06T20:11:00.000Z",
            },
          ],
        }),
        [
          [
            {
              id: 12345,
              user: { login: "coderabbitai" },
              body: "Actionable comment: fix the readiness guard with token ghp_example.",
              created_at: "2026-05-06T20:10:00.000Z",
              html_url: "https://github.com/comment/1",
            },
          ],
          [
            {
              id: 12346,
              user: { login: "coderabbitai" },
              body: "Actionable comment: fix the follow-up readiness guard.",
              created_at: "2026-05-06T20:10:30.000Z",
              html_url: "https://github.com/comment/2",
            },
          ],
        ],
        issueViewFixture([
          {
            id: "issue-comment-1",
            author: { login: "MohAnghabo" },
            body: "readiness failed after checks passed",
            createdAt: "2026-05-06T20:12:00.000Z",
          },
        ]),
      );

      const provider = yield* PrWatcherProvider.PrWatcherProvider;
      const result = yield* provider.readWatch({
        cwd: "/repo",
        repository: "MohAnghabo/kanban-console",
        prNumber: 14,
        taskId: "task-1",
        trustedBots: ["coderabbitai", "MohAnghabo"],
      });

      assert.equal(
        result.watch.reviewSignals.some((signal) => signal.kind === "change-request"),
        true,
      );
      assert.equal(
        result.watch.reviewSignals.some((signal) => signal.kind === "review-comment"),
        true,
      );
      assert.equal(
        result.watch.reviewSignals.some((signal) => signal.kind === "issue-comment"),
        true,
      );
      assert.equal(
        result.watch.reviewSignals.some((signal) => signal.summary.includes("ghp_example")),
        false,
      );
      assert.equal(
        result.watch.reviewSignals.some(
          (signal) =>
            signal.kind === "review-comment" &&
            signal.fingerprint === "review-comment:pull-request:coderabbitai:12345" &&
            signal.createdAt === "2026-05-06T20:10:00.000Z" &&
            signal.url === "https://github.com/comment/1",
        ),
        true,
      );
      assert.equal(
        result.suggestedFixes.every((fix) => fix.prompt?.includes("Do not launch auto-fix")),
        true,
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect("suppresses duplicate signals from prior polling fingerprints", () =>
    Effect.gen(function* () {
      mockGhResponses(prViewFixture());

      const provider = yield* PrWatcherProvider.PrWatcherProvider;
      const result = yield* provider.readWatch({
        cwd: "/repo",
        repository: "MohAnghabo/kanban-console",
        prNumber: 14,
        taskId: "task-1",
        previousFingerprints: ["check-run:Validate:failing"],
      });

      assert.equal(result.watch.reviewSignals[0]?.duplicateSuppressed, true);
      assert.equal(result.suggestedFixes[0]?.status, "blocked");
      assert.equal(result.suggestedFixes[0]?.guardrails.includes("duplicate-suppressed"), true);
      assert.equal(result.actionComment.materialStateChanged, false);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("polls linked task issue comments as a separate source", () =>
    Effect.gen(function* () {
      mockGhResponses(
        prViewFixture({ checkConclusion: "SUCCESS" }),
        [],
        issueViewFixture(),
        issueViewFixture([
          {
            id: "linked-issue-comment-1",
            author: { login: "coderabbitai[bot]" },
            body: "Actionable linked task comment.",
            createdAt: "2026-05-06T20:13:00.000Z",
          },
        ]),
      );

      const provider = yield* PrWatcherProvider.PrWatcherProvider;
      const result = yield* provider.readWatch({
        cwd: "/repo",
        repository: "MohAnghabo/kanban-console",
        prNumber: 14,
        taskId: "task-1",
        linkedIssueNumber: 43,
      });

      assert.equal(
        result.watch.reviewSignals.some(
          (signal) =>
            signal.kind === "issue-comment" &&
            signal.fingerprint.includes("issue-comment:linked-issue"),
        ),
        true,
      );
      expect(execute).toHaveBeenNthCalledWith(4, {
        cwd: "/repo",
        args: [
          "issue",
          "view",
          "43",
          "--repo",
          "MohAnghabo/kanban-console",
          "--comments",
          "--json",
          "comments",
        ],
        timeoutMs: 30_000,
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("keeps stale pending data visible without generating failure prompts", () =>
    Effect.gen(function* () {
      mockGhResponses(prViewFixture({ checkConclusion: null, checkStatus: "IN_PROGRESS" }));

      const provider = yield* PrWatcherProvider.PrWatcherProvider;
      const result = yield* provider.readWatch({
        cwd: "/repo",
        repository: "MohAnghabo/kanban-console",
        prNumber: 14,
        taskId: "task-1",
        pollingIntervalSeconds: 120,
        actionCommentPolicy: "new-comment",
      });

      assert.equal(result.watch.pollingIntervalSeconds, 120);
      assert.equal(result.watch.actionCommentPolicy, "new-comment");
      assert.equal(result.watch.checks[0]?.status, "pending");
      assert.equal(result.suggestedFixes.length, 0);
      assert.equal(result.actionComment.policy, "new-comment");
    }).pipe(Effect.provide(layer)),
  );
});
