import { Context, Effect, Layer, Schema } from "effect";
import type {
  KanbanConsoleArtifact,
  KanbanConsoleCheckRun,
  KanbanConsoleGitOpsPolicy,
  KanbanConsoleReleaseActionKind,
  KanbanConsoleReleaseActionRequest,
  KanbanConsoleReleaseActionResult,
  KanbanConsoleReleaseDeploymentProvider,
  KanbanConsoleReleaseGateStatus,
  KanbanConsoleReleaseNote,
  KanbanConsoleReleaseReadiness,
  KanbanConsoleReleaseRequiredCheck,
  KanbanConsoleReleaseReviewState,
} from "@t3tools/contracts";

import * as GitHubCli from "../sourceControl/GitHubCli.ts";

const DEFAULT_TIMEOUT_MS = 30_000;
const RELEASE_BRANCH_PREFIX = "release/";
type ReleaseGate = KanbanConsoleReleaseReadiness["gates"][number];

export class ReleaseWorkflowProviderError extends Schema.TaggedErrorClass<ReleaseWorkflowProviderError>()(
  "ReleaseWorkflowProviderError",
  {
    operation: Schema.String,
    detail: Schema.String,
    cause: Schema.optional(Schema.Defect),
  },
) {
  override get message(): string {
    return `Release workflow provider failed in ${this.operation}: ${this.detail}`;
  }
}

export interface ReleaseNoteSource {
  readonly id: string;
  readonly source: KanbanConsoleReleaseNote["source"];
  readonly title: string;
  readonly url?: string;
}

export interface BuildReleaseWorkflowInput {
  readonly base: KanbanConsoleReleaseReadiness;
  readonly policy: KanbanConsoleGitOpsPolicy;
  readonly issues?: ReadonlyArray<ReleaseNoteSource>;
  readonly pullRequests?: ReadonlyArray<ReleaseNoteSource>;
  readonly artifacts?: ReadonlyArray<KanbanConsoleArtifact>;
  readonly requiredChecks?: ReadonlyArray<KanbanConsoleCheckRun>;
  readonly reviewState?: KanbanConsoleReleaseReviewState;
  readonly deploymentProviders?: ReadonlyArray<KanbanConsoleReleaseDeploymentProvider>;
  readonly actionTarget?: {
    readonly repository: string;
    readonly number: number;
  };
  readonly now?: Date;
}

export interface ReleaseWorkflowProviderShape {
  readonly build: (input: BuildReleaseWorkflowInput) => KanbanConsoleReleaseReadiness;
  readonly evaluateAction: (
    readiness: KanbanConsoleReleaseReadiness,
    request: KanbanConsoleReleaseActionRequest,
  ) => KanbanConsoleReleaseActionResult;
  readonly postPreparationComment: (input: {
    readonly cwd: string;
    readonly readiness: KanbanConsoleReleaseReadiness;
    readonly request: KanbanConsoleReleaseActionRequest;
  }) => Effect.Effect<KanbanConsoleReleaseActionResult, ReleaseWorkflowProviderError>;
}

export class ReleaseWorkflowProvider extends Context.Service<
  ReleaseWorkflowProvider,
  ReleaseWorkflowProviderShape
>()("t3/kanban/ReleaseWorkflowProvider") {}

function redactSensitiveText(value: string): string {
  return value
    .replace(
      /\b(?:gh[pousr]|github_pat|doppler|sk|xox[baprs])[-_][-_A-Za-z0-9]{8,}\b/gu,
      "[redacted]",
    )
    .replace(/\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|KEY)=\S+/giu, "[redacted]");
}

function cleanTitle(value: string): string {
  const cleaned = redactSensitiveText(value)
    .replace(/[`*_<>]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

function cleanCommentField(value: string): string {
  return cleanTitle(value);
}

function noteWithOptionalUrl(input: {
  readonly id: string;
  readonly source: KanbanConsoleReleaseNote["source"];
  readonly title: string;
  readonly url?: string;
}): KanbanConsoleReleaseNote {
  const note: KanbanConsoleReleaseNote = {
    id: input.id,
    source: input.source,
    title: cleanTitle(input.title),
  };
  if (input.url) {
    return {
      id: note.id,
      source: note.source,
      title: note.title,
      url: input.url,
    };
  }
  return note;
}

function noteFromSource(
  item: ReleaseNoteSource,
  source: KanbanConsoleReleaseNote["source"],
): KanbanConsoleReleaseNote {
  if (item.url) {
    return noteWithOptionalUrl({ id: item.id, source, title: item.title, url: item.url });
  }
  return noteWithOptionalUrl({ id: item.id, source, title: item.title });
}

function checkWithOptionalUrl(check: KanbanConsoleCheckRun): KanbanConsoleReleaseRequiredCheck {
  if (check.url) {
    return {
      id: check.id,
      name: check.name,
      status: check.status,
      url: check.url,
    };
  }
  return {
    id: check.id,
    name: check.name,
    status: check.status,
  };
}

function reviewStatus(
  input: KanbanConsoleReleaseReviewState | undefined,
): KanbanConsoleReleaseGateStatus {
  if (!input) return "pending";
  if (input.status === "blocked" || input.status === "changes-requested") return "blocked";
  if (input.status === "approved" && input.changesRequested === 0 && input.pendingReviewers === 0) {
    return "passing";
  }
  return "pending";
}

function allGatesPassing(readiness: KanbanConsoleReleaseReadiness): boolean {
  return readiness.gates.every((gate) => gate.status === "passing");
}

function normalizeNotes(input: BuildReleaseWorkflowInput): ReadonlyArray<KanbanConsoleReleaseNote> {
  const issueNotes = (input.issues ?? []).map((item) => noteFromSource(item, "issue"));
  const prNotes = (input.pullRequests ?? []).map((item) => noteFromSource(item, "pull-request"));
  const artifactNotes = (input.artifacts ?? []).map((artifact) => ({
    id: artifact.id,
    source: "artifact" as const,
    title: cleanTitle(artifact.title),
  }));

  return [...issueNotes, ...prNotes, ...artifactNotes];
}

function upsertGate(
  gates: ReadonlyArray<ReleaseGate>,
  id: string,
  label: string,
  status: KanbanConsoleReleaseGateStatus,
): ReadonlyArray<ReleaseGate> {
  if (gates.some((gate) => gate.id === id)) {
    return gates.map((gate) => (gate.id === id ? { id, label, status } : gate));
  }
  return [...gates, { id, label, status }];
}

export function buildReleaseWorkflow(
  input: BuildReleaseWorkflowInput,
): KanbanConsoleReleaseReadiness {
  const notes = normalizeNotes(input);
  const requiredChecks = input.requiredChecks ?? [];
  const deploymentProviders = input.deploymentProviders ?? [];
  const releaseBranchStatus = input.base.branch.startsWith(RELEASE_BRANCH_PREFIX)
    ? "passing"
    : "blocked";
  const checksStatus =
    requiredChecks.length === 0
      ? "pending"
      : requiredChecks.some((check) => check.status === "failing")
        ? "blocked"
        : requiredChecks.every((check) => check.status === "passing")
          ? "passing"
          : "pending";
  const providersStatus =
    deploymentProviders.length === 0
      ? "pending"
      : deploymentProviders.some((provider) => provider.status === "blocked")
        ? "blocked"
        : deploymentProviders.every((provider) => provider.status === "passing")
          ? "passing"
          : "pending";

  let gates: ReadonlyArray<ReleaseGate> = [...input.base.gates];
  gates = upsertGate(
    gates,
    "gate-release-branch-policy",
    "Release branch policy",
    releaseBranchStatus,
  );
  gates = upsertGate(gates, "gate-required-checks", "Required checks", checksStatus);
  gates = upsertGate(gates, "gate-review-state", "Review state", reviewStatus(input.reviewState));
  gates = upsertGate(gates, "gate-deployment-providers", "Deployment providers", providersStatus);
  gates = upsertGate(
    gates,
    "gate-release-notes-draft",
    "Release notes draft",
    notes.length > 0 ? "passing" : "pending",
  );

  const releasePolicy = {
    prepareOnly: true,
    mergeRequiresConfirmation: true,
    deployRequiresConfirmation: true,
    tagRequiresConfirmation: true,
    destructiveActionsRequireSecondConfirmation:
      input.policy.destructiveActionsRequireSecondConfirmation,
  };
  const actionReadiness = readinessBase(gates, releasePolicy);
  const readiness: KanbanConsoleReleaseReadiness = {
    ...input.base,
    policy: releasePolicy,
    gates,
    notes,
    requiredChecks: requiredChecks.map(checkWithOptionalUrl),
    reviewState: input.reviewState ?? {
      status: "pending",
      approvals: 0,
      changesRequested: 0,
      pendingReviewers: 0,
    },
    deploymentProviders,
    actions: [
      releaseAction(actionReadiness, "prepare-comment", false, false),
      releaseAction(actionReadiness, "merge", false, false),
      releaseAction(actionReadiness, "deploy", false, false),
      releaseAction(actionReadiness, "tag", false, false),
    ],
  };

  if (input.actionTarget) {
    return {
      ...readiness,
      actionComment: {
        id: `release-comment-${input.actionTarget.number}`,
        target: `${input.actionTarget.repository}#${input.actionTarget.number}`,
        body: releasePreparationCommentBody(readiness),
        updatedAt: (input.now ?? new Date()).toISOString(),
      },
    };
  }

  return readiness;
}

function readinessBase(
  gates: ReadonlyArray<ReleaseGate>,
  policy: NonNullable<KanbanConsoleReleaseReadiness["policy"]>,
): Pick<KanbanConsoleReleaseReadiness, "gates" | "policy"> {
  return { gates, policy };
}

function releaseAction(
  readiness: Pick<KanbanConsoleReleaseReadiness, "gates" | "policy">,
  kind: KanbanConsoleReleaseActionKind,
  confirmed: boolean,
  secondConfirmed: boolean,
): KanbanConsoleReleaseActionResult {
  const destructive = kind === "merge" || kind === "deploy" || kind === "tag";
  const releaseReady = allGatesPassing({ branch: "release/preview", gates: readiness.gates });
  const requiresConfirmation = true;
  const requiresSecondConfirmation =
    destructive && (readiness.policy?.destructiveActionsRequireSecondConfirmation ?? true);

  if (!releaseReady) {
    return {
      kind,
      status: "blocked",
      message: "Release action is blocked until every release gate is passing.",
      requiresConfirmation,
      requiresSecondConfirmation,
    };
  }
  if (!confirmed) {
    return {
      kind,
      status: "blocked",
      message: "Release action requires explicit maintainer confirmation.",
      requiresConfirmation,
      requiresSecondConfirmation,
    };
  }
  if (requiresSecondConfirmation && !secondConfirmed) {
    return {
      kind,
      status: "blocked",
      message: "Merge, deploy, and tag actions require a second confirmation.",
      requiresConfirmation,
      requiresSecondConfirmation,
    };
  }

  return {
    kind,
    status: "ready",
    message:
      kind === "prepare-comment"
        ? "Release preparation comment is ready to post."
        : "Confirmation captured; execution is intentionally not performed by Phase 11.",
    requiresConfirmation,
    requiresSecondConfirmation,
  };
}

export function evaluateReleaseAction(
  readiness: KanbanConsoleReleaseReadiness,
  request: KanbanConsoleReleaseActionRequest,
): KanbanConsoleReleaseActionResult {
  return releaseAction(
    readiness,
    request.kind,
    request.confirmed,
    request.secondConfirmed ?? false,
  );
}

export function releasePreparationCommentBody(readiness: KanbanConsoleReleaseReadiness): string {
  const gateLines = readiness.gates.map(
    (gate) => `- ${cleanCommentField(gate.label)}: ${gate.status}`,
  );
  const noteLines = (readiness.notes ?? [])
    .slice(0, 8)
    .map((note) => `- ${cleanCommentField(note.title)}`);
  const providerLines = (readiness.deploymentProviders ?? []).map(
    (provider) => `- ${cleanCommentField(provider.label)}: ${provider.status}`,
  );

  return [
    "Kanban Console release preparation",
    "",
    `- Branch: ${cleanCommentField(readiness.branch)}`,
    `- Latest tag: ${cleanCommentField(readiness.latestTag ?? "none")}`,
    `- Target tag: ${cleanCommentField(readiness.targetTag ?? "not selected")}`,
    "- Execution: merge, deploy, and tag operations require explicit confirmation and are not automated by this preparation comment.",
    "",
    "Gates:",
    ...gateLines,
    "",
    "Release notes draft:",
    ...(noteLines.length > 0 ? noteLines : ["- No release note entries selected."]),
    "",
    "Deployment readiness:",
    ...(providerLines.length > 0 ? providerLines : ["- No deployment provider status configured."]),
    "",
    "Raw command output, review bodies, and secrets are intentionally omitted.",
  ].join("\n");
}

function providerError(
  operation: string,
  cause: GitHubCli.GitHubCliError,
): ReleaseWorkflowProviderError {
  return new ReleaseWorkflowProviderError({
    operation,
    detail: cause.detail,
    cause,
  });
}

export const make = Effect.fn("makeReleaseWorkflowProvider")(function* () {
  const github = yield* GitHubCli.GitHubCli;

  return ReleaseWorkflowProvider.of({
    build: buildReleaseWorkflow,
    evaluateAction: evaluateReleaseAction,
    postPreparationComment: (input) => {
      const action = evaluateReleaseAction(input.readiness, input.request);
      if (action.status === "blocked") {
        return Effect.succeed(action);
      }
      if (input.request.kind !== "prepare-comment") {
        return Effect.succeed(action);
      }

      return github
        .execute({
          cwd: input.cwd,
          args: [
            "issue",
            "comment",
            String(input.request.targetNumber),
            "--repo",
            input.request.repository,
            "--body",
            releasePreparationCommentBody(input.readiness),
          ],
          timeoutMs: DEFAULT_TIMEOUT_MS,
        })
        .pipe(
          Effect.as({
            ...action,
            status: "commented" as const,
            message: "Release preparation comment posted.",
            commentTarget: `${input.request.repository}#${input.request.targetNumber}`,
          }),
          Effect.mapError((error) => providerError("postPreparationComment", error)),
        );
    },
  });
});

export const layer = Layer.effect(ReleaseWorkflowProvider, make());
