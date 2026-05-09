// @effect-diagnostics globalDate:off
// @effect-diagnostics importFromBarrel:off
// Kanban provider code follows the existing service-layer shape from prior phases; Date injection remains testable through provider options.
import { Context, Effect, Layer, Schema } from "effect";
import type {
  KanbanConsoleAgentWorkflowSession,
  KanbanConsoleAutoFixAttemptRecord,
  KanbanConsoleAutoFixGate,
  KanbanConsoleAutoFixPolicy,
  KanbanConsoleAutoFixRun,
  KanbanConsoleReviewSignal,
  KanbanConsoleSuggestedFix,
} from "@t3tools/contracts";

import * as GitHubCli from "../sourceControl/GitHubCli.ts";

const DEFAULT_TIMEOUT_MS = 30_000;

export class GatedAutoFixProviderError extends Schema.TaggedErrorClass<GatedAutoFixProviderError>()(
  "GatedAutoFixProviderError",
  {
    operation: Schema.String,
    detail: Schema.String,
    cause: Schema.optional(Schema.Defect),
  },
) {
  override get message(): string {
    return `Gated auto-fix provider failed in ${this.operation}: ${this.detail}`;
  }
}

export interface EvaluateAutoFixInput {
  readonly suggestedFix: KanbanConsoleSuggestedFix;
  readonly reviewSignals: ReadonlyArray<KanbanConsoleReviewSignal>;
  readonly policy: KanbanConsoleAutoFixPolicy;
  readonly branch: string;
  readonly labels?: ReadonlyArray<string>;
  readonly previousAttempts?: ReadonlyArray<KanbanConsoleAutoFixAttemptRecord>;
  readonly confirmed: boolean;
  readonly now?: Date;
}

export interface AutoFixCommentOptions {
  readonly cwd: string;
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly run: KanbanConsoleAutoFixRun;
  readonly confirmed: boolean;
}

export interface GatedAutoFixProviderShape {
  readonly evaluate: (input: EvaluateAutoFixInput) => KanbanConsoleAutoFixRun;
  readonly queueSession: (run: KanbanConsoleAutoFixRun) => KanbanConsoleAgentWorkflowSession;
  readonly postRunComment: (
    input: AutoFixCommentOptions,
  ) => Effect.Effect<void, GatedAutoFixProviderError>;
}

export class GatedAutoFixProvider extends Context.Service<
  GatedAutoFixProvider,
  GatedAutoFixProviderShape
>()("t3/kanban/GatedAutoFixProvider") {}

function normalizedSet(values: ReadonlyArray<string>): ReadonlySet<string> {
  return new Set(values.map((value) => value.toLowerCase()));
}

function sourceSignals(input: EvaluateAutoFixInput): ReadonlyArray<KanbanConsoleReviewSignal> {
  const ids = new Set(input.suggestedFix.sourceSignalIds ?? []);
  return input.reviewSignals.filter((signal) => ids.has(signal.id));
}

function findingFingerprint(signals: ReadonlyArray<KanbanConsoleReviewSignal>): string {
  if (signals.length === 0) return "manual-fix";
  return signals
    .map((signal) => signal.fingerprint)
    .toSorted()
    .join("|");
}

function matchingAttempt(
  fingerprint: string,
  attempts: ReadonlyArray<KanbanConsoleAutoFixAttemptRecord> | undefined,
): KanbanConsoleAutoFixAttemptRecord | undefined {
  return attempts?.find((attempt) => attempt.fingerprint === fingerprint);
}

function branchMatchesPattern(branch: string, pattern: string): boolean {
  if (pattern.endsWith("*")) {
    return branch.startsWith(pattern.slice(0, -1));
  }
  return branch === pattern;
}

function branchAllowed(branch: string, policy: KanbanConsoleAutoFixPolicy): boolean {
  if (policy.protectedBranches.some((pattern) => branchMatchesPattern(branch, pattern))) {
    return false;
  }
  return policy.allowedBranchPrefixes.some((prefix) => branch.startsWith(prefix));
}

function runStatus(
  gates: ReadonlyArray<KanbanConsoleAutoFixGate>,
): KanbanConsoleAutoFixRun["status"] {
  const blockedGate = gates.find((gate) => gate.status === "blocked");
  if (!blockedGate) return "queued";
  if (blockedGate.kind === "attempt-budget") return "exhausted";
  if (blockedGate.kind === "ai-loop-credentials") return "setup-required";
  return "blocked";
}

function gate(
  kind: KanbanConsoleAutoFixGate["kind"],
  status: KanbanConsoleAutoFixGate["status"],
  message: string,
): KanbanConsoleAutoFixGate {
  return {
    id: kind,
    kind,
    status,
    message,
  };
}

export function evaluateAutoFix(input: EvaluateAutoFixInput): KanbanConsoleAutoFixRun {
  const signals = sourceSignals(input);
  const fingerprint = findingFingerprint(signals);
  const attempt = matchingAttempt(fingerprint, input.previousAttempts);
  const attemptsUsed = attempt?.attemptsUsed ?? 0;
  const maxAttempts = attempt?.maxAttempts ?? input.policy.maxAttemptsPerFingerprint;
  const labels = normalizedSet(input.labels ?? []);
  const pauseLabels = normalizedSet(input.policy.pauseLabels);
  const paused = [...pauseLabels].some((label) => labels.has(label));
  const trustedSources = normalizedSet(input.policy.trustedSources);
  const trustedSignals =
    signals.length > 0 &&
    signals.every(
      (signal) => signal.trusted === true || trustedSources.has(signal.source.toLowerCase()),
    );
  const validationCommands = input.policy.requiredValidationCommands;
  const gates: KanbanConsoleAutoFixGate[] = [
    gate(
      "trusted-source",
      trustedSignals ? "pass" : "blocked",
      trustedSignals
        ? "All source signals are trusted."
        : "Auto-fix requires trusted source signals.",
    ),
    gate(
      "finding-fingerprint",
      fingerprint === "manual-fix" ? "blocked" : "pass",
      fingerprint === "manual-fix"
        ? "Auto-fix requires a stable finding fingerprint."
        : "Finding fingerprint is stable.",
    ),
    gate(
      "attempt-budget",
      attemptsUsed >= maxAttempts ? "blocked" : "pass",
      attemptsUsed >= maxAttempts
        ? "Auto-fix attempt budget is exhausted."
        : "Auto-fix attempt budget remains available.",
    ),
    gate(
      "pause-label",
      paused ? "blocked" : "pass",
      paused ? "Pause label is present." : "No pause label is present.",
    ),
    gate(
      "branch-policy",
      branchAllowed(input.branch, input.policy) ? "pass" : "blocked",
      branchAllowed(input.branch, input.policy)
        ? "Branch is eligible for auto-fix."
        : "Branch policy blocks auto-fix.",
    ),
    gate(
      "validation",
      validationCommands.length > 0 ? "pass" : "blocked",
      validationCommands.length > 0
        ? "Validation commands are configured before push."
        : "Auto-fix requires validation commands before push.",
    ),
    gate(
      "ai-loop-credentials",
      input.policy.aiLoopCredentialsConfigured ? "pass" : "blocked",
      input.policy.aiLoopCredentialsConfigured
        ? "AI-loop credentials are configured."
        : "AI-loop credentials are missing; setup is required.",
    ),
    gate(
      "confirmation",
      input.confirmed ? "pass" : "blocked",
      input.confirmed
        ? "Maintainer confirmed auto-fix queueing."
        : "Auto-fix queueing requires explicit confirmation.",
    ),
  ];
  const status = runStatus(gates);
  const updatedAt = (input.now ?? new Date()).toISOString();

  return {
    id: `autofix-${input.suggestedFix.id}`,
    taskId: input.suggestedFix.taskId,
    suggestedFixId: input.suggestedFix.id,
    prWatchId: input.suggestedFix.prWatchId,
    command: input.suggestedFix.command,
    status,
    fingerprint,
    branch: input.branch,
    attemptsUsed: status === "queued" ? attemptsUsed + 1 : attemptsUsed,
    maxAttempts,
    validationCommands,
    gates,
    sourceSignalIds: input.suggestedFix.sourceSignalIds ?? [],
    ...(status === "queued" ? { sessionId: `autofix-session-${input.suggestedFix.id}` } : {}),
    summary:
      status === "queued"
        ? "Auto-fix queued behind source, budget, branch, credential, and validation gates."
        : (gates.find((item) => item.status === "blocked")?.message ?? "Auto-fix is blocked."),
    updatedAt,
  };
}

export function queueAutoFixSession(
  run: KanbanConsoleAutoFixRun,
): KanbanConsoleAgentWorkflowSession {
  return {
    id: run.sessionId ?? `blocked-${run.id}`,
    taskId: run.taskId,
    workflowId: "autofix",
    agent: "Codex",
    command: run.command,
    status: run.status === "queued" ? "queued" : "blocked",
    duplicateKey: `${run.taskId}:autofix:${run.fingerprint}:${run.branch}`,
    duplicateSuppressed: false,
    summary: run.summary,
    startedAt: run.updatedAt,
    ...(run.status === "queued" ? {} : { finishedAt: run.updatedAt }),
  };
}

export function autoFixCommentBody(run: KanbanConsoleAutoFixRun): string {
  return [
    `Kanban Console auto-fix ${run.status}.`,
    "",
    `- Task: ${run.taskId}`,
    `- Suggested fix: ${run.suggestedFixId}`,
    `- Command: ${run.command}`,
    `- Fingerprint: ${run.fingerprint}`,
    `- Attempts: ${run.attemptsUsed}/${run.maxAttempts}`,
    `- Branch: ${run.branch}`,
    `- Validation: ${run.validationCommands.join(", ") || "not configured"}`,
    `- Summary: ${run.summary}`,
    "",
    "Raw command output is intentionally omitted.",
  ].join("\n");
}

function providerError(
  operation: string,
  cause: GitHubCli.GitHubCliError,
): GatedAutoFixProviderError {
  return new GatedAutoFixProviderError({
    operation,
    detail: cause.detail,
    cause,
  });
}

export const make = Effect.fn("makeGatedAutoFixProvider")(function* () {
  const github = yield* GitHubCli.GitHubCli;

  return GatedAutoFixProvider.of({
    evaluate: evaluateAutoFix,
    queueSession: queueAutoFixSession,
    postRunComment: (input) => {
      if (!input.confirmed) {
        return Effect.fail(
          new GatedAutoFixProviderError({
            operation: "postRunComment",
            detail: "GitHub PR comments for auto-fix runs require explicit confirmation.",
          }),
        );
      }

      return github
        .execute({
          cwd: input.cwd,
          args: [
            "pr",
            "comment",
            String(input.pullRequestNumber),
            "--repo",
            input.repository,
            "--body",
            autoFixCommentBody(input.run),
          ],
          timeoutMs: DEFAULT_TIMEOUT_MS,
        })
        .pipe(
          Effect.asVoid,
          Effect.mapError((error) => providerError("postRunComment", error)),
        );
    },
  });
});

export const layer = Layer.effect(GatedAutoFixProvider, make());
