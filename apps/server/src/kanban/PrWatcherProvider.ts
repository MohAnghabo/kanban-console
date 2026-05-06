import { Context, Effect, Layer, Schema, SchemaIssue } from "effect";
import type {
  KanbanConsoleActionCommentPolicy,
  KanbanConsoleCheckRun,
  KanbanConsoleCheckStatus,
  KanbanConsolePrWatchActionComment,
  KanbanConsolePullRequestWatch,
  KanbanConsoleReviewSignal,
  KanbanConsoleSuggestedFix,
} from "@t3tools/contracts";

import * as GitHubCli from "../sourceControl/GitHubCli.ts";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_POLLING_INTERVAL_SECONDS = 60;
const DEFAULT_TRUSTED_BOTS = ["coderabbitai", "coderabbitai[bot]"] as const;

const RawPrView = Schema.Struct({
  number: Schema.Number,
  title: Schema.String,
  url: Schema.optional(Schema.String),
  statusCheckRollup: Schema.optional(Schema.Array(Schema.Unknown)),
  reviews: Schema.optional(Schema.Array(Schema.Unknown)),
  comments: Schema.optional(Schema.Array(Schema.Unknown)),
  updatedAt: Schema.optional(Schema.String),
});

const RawIssueView = Schema.Struct({
  comments: Schema.optional(Schema.Array(Schema.Unknown)),
});

const RawReviewCommentPages = Schema.Array(Schema.Unknown);

export interface ReadPrWatchInput {
  readonly cwd: string;
  readonly repository: string;
  readonly prNumber: number;
  readonly taskId: string;
  readonly linkedIssueNumber?: number;
  readonly linkedIssueRepository?: string;
  readonly previousFingerprints?: ReadonlyArray<string>;
  readonly trustedBots?: ReadonlyArray<string>;
  readonly pollingIntervalSeconds?: number;
  readonly actionCommentPolicy?: KanbanConsoleActionCommentPolicy;
  readonly now?: string;
}

export interface PrWatchReadResult {
  readonly watch: KanbanConsolePullRequestWatch;
  readonly suggestedFixes: ReadonlyArray<KanbanConsoleSuggestedFix>;
  readonly actionComment: KanbanConsolePrWatchActionComment;
}

export class PrWatcherProviderError extends Schema.TaggedErrorClass<PrWatcherProviderError>()(
  "PrWatcherProviderError",
  {
    operation: Schema.String,
    detail: Schema.String,
    cause: Schema.optional(Schema.Defect),
  },
) {
  override get message(): string {
    return `PR watcher provider failed in ${this.operation}: ${this.detail}`;
  }
}

export interface PrWatcherProviderShape {
  readonly readWatch: (
    input: ReadPrWatchInput,
  ) => Effect.Effect<PrWatchReadResult, PrWatcherProviderError>;
}

export class PrWatcherProvider extends Context.Service<PrWatcherProvider, PrWatcherProviderShape>()(
  "t3/kanban/PrWatcherProvider",
) {}

function decodeJson<S extends Schema.Top>(
  operation: string,
  raw: string,
  schema: S,
): Effect.Effect<S["Type"], PrWatcherProviderError, S["DecodingServices"]> {
  return Schema.decodeEffect(Schema.fromJsonString(schema))(raw).pipe(
    Effect.mapError(
      (error) =>
        new PrWatcherProviderError({
          operation,
          detail: `GitHub CLI returned invalid JSON: ${SchemaIssue.makeFormatterDefault()(error.issue)}`,
          cause: error,
        }),
    ),
  );
}

function providerError(operation: string, cause: GitHubCli.GitHubCliError): PrWatcherProviderError {
  return new PrWatcherProviderError({
    operation,
    detail: cause.detail,
    cause,
  });
}

function objectValue(input: unknown): Record<string, unknown> | null {
  return typeof input === "object" && input !== null && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : null;
}

function stringValue(input: unknown): string | null {
  return typeof input === "string" && input.trim().length > 0 ? input.trim() : null;
}

function scalarStringValue(input: unknown): string | null {
  if (typeof input === "number" && Number.isFinite(input)) return String(input);
  return stringValue(input);
}

function authorLogin(input: Record<string, unknown>): string {
  return (
    stringValue(objectValue(input.author)?.login) ??
    stringValue(objectValue(input.user)?.login) ??
    "unknown"
  );
}

function isoValue(input: unknown, fallback: string): string {
  return stringValue(input) ?? fallback;
}

function commentUrl(input: Record<string, unknown>): string | undefined {
  return stringValue(input.url) ?? stringValue(input.html_url) ?? undefined;
}

function commentCreatedAt(input: Record<string, unknown>, fallback: string): string {
  return isoValue(input.createdAt ?? input.created_at, fallback);
}

function checkStatus(raw: Record<string, unknown>): KanbanConsoleCheckStatus {
  const conclusion = stringValue(raw.conclusion)?.toLowerCase();
  const status = stringValue(raw.status)?.toLowerCase();
  const state = stringValue(raw.state)?.toLowerCase();

  if (conclusion === "failure" || conclusion === "timed_out" || state === "failure") {
    return "failing";
  }
  if (conclusion === "skipped" || state === "skipped") return "skipped";
  if (conclusion === "success" || state === "success") return "passing";
  if (status === "completed" && !conclusion) return "passing";
  return "pending";
}

function checkId(raw: Record<string, unknown>, index: number): string {
  return (
    stringValue(raw.databaseId) ??
    stringValue(raw.id) ??
    stringValue(raw.name)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") ??
    `check-${index + 1}`
  );
}

function checkName(raw: Record<string, unknown>): string {
  return stringValue(raw.name) ?? stringValue(raw.context) ?? "Unnamed check";
}

function checkUrl(raw: Record<string, unknown>): string | undefined {
  return stringValue(raw.detailsUrl) ?? stringValue(raw.targetUrl) ?? undefined;
}

function checkRuns(raw: ReadonlyArray<unknown> | undefined): ReadonlyArray<KanbanConsoleCheckRun> {
  return (raw ?? []).flatMap((entry, index) => {
    const item = objectValue(entry);
    if (!item) return [];
    return [
      {
        id: checkId(item, index),
        name: checkName(item),
        status: checkStatus(item),
        ...(checkUrl(item) ? { url: checkUrl(item) } : {}),
      },
    ];
  });
}

function signalId(prefix: string, fingerprint: string): string {
  return `${prefix}-${fingerprint.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function trusted(login: string, trustedBots: ReadonlySet<string>): boolean {
  return trustedBots.has(login) || trustedBots.has(`${login}[bot]`);
}

function checkSignals(input: {
  readonly checks: ReadonlyArray<KanbanConsoleCheckRun>;
  readonly previousFingerprints: ReadonlySet<string>;
  readonly now: string;
}): ReadonlyArray<KanbanConsoleReviewSignal> {
  return input.checks.flatMap((check) => {
    if (check.status !== "failing") return [];
    const fingerprint = `check-run:${check.name}:${check.status}`;
    return [
      {
        id: signalId("signal", fingerprint),
        kind: "ci-failure",
        sourceKind: check.name.toLowerCase().includes("workflow") ? "workflow-run" : "check-run",
        source: "GitHub Actions",
        summary: `${check.name} is failing.`,
        fingerprint,
        ...(check.url ? { url: check.url } : {}),
        trusted: true,
        duplicateSuppressed: input.previousFingerprints.has(fingerprint),
        createdAt: input.now,
      },
    ];
  });
}

function reviewSignals(input: {
  readonly reviews: ReadonlyArray<unknown> | undefined;
  readonly previousFingerprints: ReadonlySet<string>;
  readonly trustedBots: ReadonlySet<string>;
  readonly now: string;
}): ReadonlyArray<KanbanConsoleReviewSignal> {
  return (input.reviews ?? []).flatMap((entry) => {
    const review = objectValue(entry);
    if (!review) return [];
    const state = stringValue(review.state)?.toUpperCase();
    const login = authorLogin(review);
    if (state !== "CHANGES_REQUESTED" && state !== "COMMENTED" && state !== "APPROVED") return [];
    const kind =
      state === "CHANGES_REQUESTED"
        ? "change-request"
        : state === "APPROVED"
          ? "approval"
          : "review-comment";
    const fingerprint = `review-summary:${login}:${state}:${stringValue(review.submittedAt) ?? input.now}`;
    return [
      {
        id: signalId("signal", fingerprint),
        kind,
        sourceKind: "review-summary",
        source: login,
        summary:
          state === "CHANGES_REQUESTED"
            ? `${login} requested changes.`
            : state === "APPROVED"
              ? `${login} approved the PR.`
              : `${login} left a review summary.`,
        fingerprint,
        ...(stringValue(review.url) ? { url: stringValue(review.url) ?? undefined } : {}),
        trusted: trusted(login, input.trustedBots),
        duplicateSuppressed: input.previousFingerprints.has(fingerprint),
        createdAt: isoValue(review.submittedAt, input.now),
      },
    ];
  });
}

function commentSignals(input: {
  readonly comments: ReadonlyArray<unknown> | undefined;
  readonly sourceKind: "review-comment" | "issue-comment";
  readonly scope: "pull-request" | "linked-issue";
  readonly previousFingerprints: ReadonlySet<string>;
  readonly trustedBots: ReadonlySet<string>;
  readonly now: string;
}): ReadonlyArray<KanbanConsoleReviewSignal> {
  return (input.comments ?? []).flatMap((entry, index) => {
    const comment = objectValue(entry);
    if (!comment) return [];
    const login = authorLogin(comment);
    const body = stringValue(comment.body) ?? "";
    const url = commentUrl(comment);
    const commentId =
      scalarStringValue(comment.id) ??
      scalarStringValue(comment.node_id) ??
      url ??
      `${input.sourceKind}-${input.scope}-${index + 1}`;
    const fingerprint = `${input.sourceKind}:${input.scope}:${login}:${commentId}`;
    const isTrusted = trusted(login, input.trustedBots);
    const isActionable =
      isTrusted ||
      /\b(failing|failed|requested changes|actionable|fix|blocked|readiness)\b/iu.test(body);
    if (!isActionable) return [];
    return [
      {
        id: signalId("signal", fingerprint),
        kind: input.sourceKind === "issue-comment" ? "issue-comment" : "review-comment",
        sourceKind: input.sourceKind,
        source: login,
        summary: `${login} left an actionable ${input.sourceKind.replace("-", " ")} on the ${
          input.scope === "linked-issue" ? "linked task issue" : "pull request"
        }.`,
        fingerprint,
        ...(url ? { url } : {}),
        trusted: isTrusted,
        duplicateSuppressed: input.previousFingerprints.has(fingerprint),
        createdAt: commentCreatedAt(comment, input.now),
      },
    ];
  });
}

function suggestedFixStatus(
  signal: KanbanConsoleReviewSignal,
): KanbanConsoleSuggestedFix["status"] {
  if (signal.duplicateSuppressed) return "blocked";
  if (signal.kind === "approval") return "blocked";
  return signal.trusted ? "eligible" : "needs-confirmation";
}

function suggestedFixCommand(signal: KanbanConsoleReviewSignal): string {
  if (signal.kind === "ci-failure") return "/ship t3-kanban-project-console";
  if (signal.kind === "change-request" || signal.kind === "review-comment") return "/review";
  return "/orchestrate t3-kanban-project-console";
}

function suggestedFixPrompt(signal: KanbanConsoleReviewSignal): string {
  return [
    "Inspect this PR watcher signal and propose the smallest safe fix.",
    `Signal: ${signal.summary}`,
    `Source: ${signal.source}`,
    "Do not launch auto-fix without explicit confirmation.",
    "Redact logs and omit raw command output from GitHub comments.",
  ].join("\n");
}

function buildSuggestedFixes(input: {
  readonly taskId: string;
  readonly prWatchId: string;
  readonly signals: ReadonlyArray<KanbanConsoleReviewSignal>;
}): ReadonlyArray<KanbanConsoleSuggestedFix> {
  return input.signals
    .filter((signal) => signal.kind !== "approval")
    .map((signal) => ({
      id: `fix-${signal.id}`,
      taskId: input.taskId,
      prWatchId: input.prWatchId,
      title:
        signal.kind === "ci-failure"
          ? `Inspect failing ${signal.sourceKind ?? "check"}`
          : `Review ${signal.source} signal`,
      command: suggestedFixCommand(signal),
      status: suggestedFixStatus(signal),
      guardrails: [
        "requires-confirmation",
        "redact-logs",
        "no-auto-fix-launch",
        ...(signal.trusted ? ["trusted-source"] : ["untrusted-source"]),
        ...(signal.duplicateSuppressed ? ["duplicate-suppressed"] : []),
      ],
      prompt: suggestedFixPrompt(signal),
      sourceSignalIds: [signal.id],
    }));
}

function actionComment(input: {
  readonly prWatchId: string;
  readonly policy: KanbanConsoleActionCommentPolicy;
  readonly signals: ReadonlyArray<KanbanConsoleReviewSignal>;
  readonly checks: ReadonlyArray<KanbanConsoleCheckRun>;
  readonly now: string;
}): KanbanConsolePrWatchActionComment {
  const materialSignals = input.signals.filter((signal) => !signal.duplicateSuppressed);
  const failingChecks = input.checks.filter((check) => check.status === "failing");
  const body = [
    "Kanban Console PR watcher update",
    "",
    `- Checks failing: ${failingChecks.length}`,
    `- New material signals: ${materialSignals.length}`,
    `- Comment policy: ${input.policy}`,
    "- Suggested fixes require explicit confirmation.",
    "- Raw logs and review bodies are intentionally summarized.",
  ].join("\n");
  return {
    id: `action-${input.prWatchId}`,
    prWatchId: input.prWatchId,
    policy: input.policy,
    body,
    materialStateChanged: materialSignals.length > 0,
    duplicateSuppressed: materialSignals.length === 0,
    updatedAt: input.now,
  };
}

function readIssueComments(input: {
  readonly github: GitHubCli.GitHubCliShape;
  readonly cwd: string;
  readonly repository: string;
  readonly issueNumber: number;
  readonly operation: string;
}): Effect.Effect<ReadonlyArray<unknown>, PrWatcherProviderError> {
  return input.github
    .execute({
      cwd: input.cwd,
      args: [
        "issue",
        "view",
        String(input.issueNumber),
        "--repo",
        input.repository,
        "--comments",
        "--json",
        "comments",
      ],
      timeoutMs: DEFAULT_TIMEOUT_MS,
    })
    .pipe(
      Effect.mapError((cause) => providerError(input.operation, cause)),
      Effect.flatMap((output) => decodeJson(input.operation, output.stdout, RawIssueView)),
      Effect.map((issue) => issue.comments ?? []),
    );
}

function readReviewComments(input: {
  readonly github: GitHubCli.GitHubCliShape;
  readonly cwd: string;
  readonly repository: string;
  readonly prNumber: number;
}): Effect.Effect<ReadonlyArray<unknown>, PrWatcherProviderError> {
  return input.github
    .execute({
      cwd: input.cwd,
      args: [
        "api",
        `repos/${input.repository}/pulls/${input.prNumber}/comments`,
        "--paginate",
        "--slurp",
      ],
      timeoutMs: DEFAULT_TIMEOUT_MS,
    })
    .pipe(
      Effect.mapError((cause) => providerError("reviewComments", cause)),
      Effect.flatMap((output) =>
        decodeJson("reviewComments", output.stdout, RawReviewCommentPages),
      ),
      Effect.map((pages) => pages.flatMap((page) => (Array.isArray(page) ? page : [page]))),
    );
}

export const make = Effect.fn("PrWatcherProvider.make")(function* () {
  const github = yield* GitHubCli.GitHubCli;

  return {
    readWatch: Effect.fn("PrWatcherProvider.readWatch")(function* (input: ReadPrWatchInput) {
      const now = input.now ?? new Date().toISOString();
      const trustedBots = new Set(input.trustedBots ?? DEFAULT_TRUSTED_BOTS);
      const previousFingerprints = new Set(input.previousFingerprints ?? []);
      const policy = input.actionCommentPolicy ?? "sticky";
      const pollingIntervalSeconds =
        input.pollingIntervalSeconds ?? DEFAULT_POLLING_INTERVAL_SECONDS;
      const prWatchId = `${input.repository}#${input.prNumber}`.replace(/[^a-zA-Z0-9]+/g, "-");

      const pr = yield* github
        .execute({
          cwd: input.cwd,
          args: [
            "pr",
            "view",
            String(input.prNumber),
            "--repo",
            input.repository,
            "--json",
            "number,title,url,statusCheckRollup,reviews,updatedAt",
          ],
          timeoutMs: DEFAULT_TIMEOUT_MS,
        })
        .pipe(
          Effect.mapError((cause) => providerError("prView", cause)),
          Effect.flatMap((output) => decodeJson("prView", output.stdout, RawPrView)),
        );

      const reviewComments = yield* readReviewComments({
        github,
        cwd: input.cwd,
        repository: input.repository,
        prNumber: input.prNumber,
      });

      const prIssueComments = yield* readIssueComments({
        github,
        cwd: input.cwd,
        repository: input.repository,
        issueNumber: input.prNumber,
        operation: "prIssueComments",
      });

      const linkedIssueComments =
        input.linkedIssueNumber === undefined
          ? []
          : yield* readIssueComments({
              github,
              cwd: input.cwd,
              repository: input.linkedIssueRepository ?? input.repository,
              issueNumber: input.linkedIssueNumber,
              operation: "linkedIssueComments",
            });

      const checks = checkRuns(pr.statusCheckRollup);
      const signals = [
        ...checkSignals({ checks, previousFingerprints, now }),
        ...reviewSignals({
          reviews: pr.reviews,
          previousFingerprints,
          trustedBots,
          now,
        }),
        ...commentSignals({
          comments: reviewComments,
          sourceKind: "review-comment",
          scope: "pull-request",
          previousFingerprints,
          trustedBots,
          now,
        }),
        ...commentSignals({
          comments: prIssueComments,
          sourceKind: "issue-comment",
          scope: "pull-request",
          previousFingerprints,
          trustedBots,
          now,
        }),
        ...commentSignals({
          comments: linkedIssueComments,
          sourceKind: "issue-comment",
          scope: "linked-issue",
          previousFingerprints,
          trustedBots,
          now,
        }),
      ];

      const watch: KanbanConsolePullRequestWatch = {
        id: prWatchId,
        repo: input.repository.split("/").at(-1) ?? input.repository,
        pr: `${input.repository.split("/").at(-1) ?? input.repository}#${pr.number}`,
        title: pr.title,
        taskId: input.taskId,
        pollingIntervalSeconds,
        actionCommentPolicy: policy,
        checks,
        reviewSignals: signals,
        lastSeenAt: isoValue(pr.updatedAt, now),
      };

      return {
        watch,
        suggestedFixes: buildSuggestedFixes({
          taskId: input.taskId,
          prWatchId,
          signals,
        }),
        actionComment: actionComment({ prWatchId, policy, signals, checks, now }),
      };
    }),
  } satisfies PrWatcherProviderShape;
});

export const layer = Layer.effect(PrWatcherProvider, make());
