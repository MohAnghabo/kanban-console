import { Schema } from "effect";
import { IsoDateTime, NonNegativeInt, PositiveInt, TrimmedNonEmptyString } from "./baseSchemas.ts";

export const KanbanConsoleLocale = Schema.Literals(["en", "ar"]);
export type KanbanConsoleLocale = typeof KanbanConsoleLocale.Type;

export const KanbanColumnId = Schema.Literals([
  "backlog",
  "ready",
  "in-progress",
  "review",
  "blocked",
  "done",
]);
export type KanbanColumnId = typeof KanbanColumnId.Type;

export const KanbanConsolePriority = Schema.Literals(["P0", "P1", "P2"]);
export type KanbanConsolePriority = typeof KanbanConsolePriority.Type;

export const KanbanConsoleAgentKind = Schema.Literals(["Codex", "Claude", "Human"]);
export type KanbanConsoleAgentKind = typeof KanbanConsoleAgentKind.Type;

export const KanbanConsoleRepoStatus = Schema.Literals(["healthy", "attention", "blocked"]);
export type KanbanConsoleRepoStatus = typeof KanbanConsoleRepoStatus.Type;

export const KanbanConsoleCheckStatus = Schema.Literals([
  "passing",
  "pending",
  "failing",
  "skipped",
]);
export type KanbanConsoleCheckStatus = typeof KanbanConsoleCheckStatus.Type;

export const KanbanConsoleReviewSignalKind = Schema.Literals([
  "ci-failure",
  "review-comment",
  "issue-comment",
  "approval",
  "change-request",
]);
export type KanbanConsoleReviewSignalKind = typeof KanbanConsoleReviewSignalKind.Type;

export const KanbanConsolePrWatchSignalSource = Schema.Literals([
  "check-run",
  "workflow-run",
  "review-comment",
  "review-summary",
  "issue-comment",
]);
export type KanbanConsolePrWatchSignalSource = typeof KanbanConsolePrWatchSignalSource.Type;

export const KanbanConsoleActionCommentPolicy = Schema.Literals(["sticky", "new-comment"]);
export type KanbanConsoleActionCommentPolicy = typeof KanbanConsoleActionCommentPolicy.Type;

export const KanbanConsoleSuggestedFixStatus = Schema.Literals([
  "eligible",
  "needs-confirmation",
  "blocked",
  "queued",
]);
export type KanbanConsoleSuggestedFixStatus = typeof KanbanConsoleSuggestedFixStatus.Type;

export const KanbanConsoleAutoFixStatus = Schema.Literals([
  "queued",
  "running",
  "pushed",
  "blocked",
  "exhausted",
  "clean",
  "setup-required",
]);
export type KanbanConsoleAutoFixStatus = typeof KanbanConsoleAutoFixStatus.Type;

export const KanbanConsoleCliToolId = Schema.Literals([
  "gh",
  "git",
  "coderabbit",
  "doppler",
  "vercel",
  "render",
  "bun",
  "bash",
]);
export type KanbanConsoleCliToolId = typeof KanbanConsoleCliToolId.Type;

export const KanbanConsoleCliAdapterAvailability = Schema.Literals([
  "available",
  "missing",
  "setup-required",
  "disabled",
]);
export type KanbanConsoleCliAdapterAvailability = typeof KanbanConsoleCliAdapterAvailability.Type;

export const KanbanConsoleCliMutationPolicy = Schema.Literals([
  "read-only",
  "requires-confirmation",
  "blocked",
]);
export type KanbanConsoleCliMutationPolicy = typeof KanbanConsoleCliMutationPolicy.Type;

export const KanbanConsoleCliAuditStatus = Schema.Literals([
  "succeeded",
  "failed",
  "blocked",
  "timed-out",
]);
export type KanbanConsoleCliAuditStatus = typeof KanbanConsoleCliAuditStatus.Type;

export const KanbanConsoleAutoFixGateKind = Schema.Literals([
  "trusted-source",
  "attempt-budget",
  "finding-fingerprint",
  "pause-label",
  "branch-policy",
  "validation",
  "ai-loop-credentials",
  "confirmation",
]);
export type KanbanConsoleAutoFixGateKind = typeof KanbanConsoleAutoFixGateKind.Type;

export const KanbanConsoleAutoFixGateStatus = Schema.Literals(["pass", "blocked", "warning"]);
export type KanbanConsoleAutoFixGateStatus = typeof KanbanConsoleAutoFixGateStatus.Type;

export const KanbanConsoleCommandRunStatus = Schema.Literals([
  "queued",
  "running",
  "succeeded",
  "failed",
  "blocked",
]);
export type KanbanConsoleCommandRunStatus = typeof KanbanConsoleCommandRunStatus.Type;

export const KanbanConsoleAgentSessionStatus = Schema.Literals([
  "queued",
  "running",
  "succeeded",
  "failed",
  "blocked",
]);
export type KanbanConsoleAgentSessionStatus = typeof KanbanConsoleAgentSessionStatus.Type;

export const KanbanConsoleAgentWorkflowCommandId = Schema.Literals([
  "init-project",
  "user-stories",
  "plan",
  "phase",
  "execute-task",
  "review",
  "open-pr",
  "ship",
  "extract-pr-learnings",
  "pdpl-audit",
  "ifrs-audit",
  "orchestrate",
]);
export type KanbanConsoleAgentWorkflowCommandId = typeof KanbanConsoleAgentWorkflowCommandId.Type;

export const KanbanConsoleArtifactStatus = Schema.Literals(["clean", "dirty", "conflict"]);
export type KanbanConsoleArtifactStatus = typeof KanbanConsoleArtifactStatus.Type;

export const KanbanConsoleArtifactWriteStatus = Schema.Literals(["applied", "blocked"]);
export type KanbanConsoleArtifactWriteStatus = typeof KanbanConsoleArtifactWriteStatus.Type;

export const KanbanConsoleReleaseGateStatus = Schema.Literals(["passing", "pending", "blocked"]);
export type KanbanConsoleReleaseGateStatus = typeof KanbanConsoleReleaseGateStatus.Type;

export const KanbanConsoleReleaseReviewStatus = Schema.Literals([
  "approved",
  "changes-requested",
  "pending",
  "blocked",
]);
export type KanbanConsoleReleaseReviewStatus = typeof KanbanConsoleReleaseReviewStatus.Type;

export const KanbanConsoleReleaseActionKind = Schema.Literals([
  "prepare-comment",
  "merge",
  "deploy",
  "tag",
]);
export type KanbanConsoleReleaseActionKind = typeof KanbanConsoleReleaseActionKind.Type;

export const KanbanConsoleReleaseActionStatus = Schema.Literals(["ready", "commented", "blocked"]);
export type KanbanConsoleReleaseActionStatus = typeof KanbanConsoleReleaseActionStatus.Type;

export const KanbanConsoleGitFileChangeKind = Schema.Literals([
  "added",
  "modified",
  "deleted",
  "renamed",
  "copied",
  "unmerged",
  "unknown",
]);
export type KanbanConsoleGitFileChangeKind = typeof KanbanConsoleGitFileChangeKind.Type;

export const KanbanConsoleGitHunkStagingSupport = Schema.Literals([
  "supported",
  "unsupported",
  "not-applicable",
]);
export type KanbanConsoleGitHunkStagingSupport = typeof KanbanConsoleGitHunkStagingSupport.Type;

export const KanbanConsoleGitPolicyViolationKind = Schema.Literals([
  "protected-branch",
  "invalid-work-branch-prefix",
  "missing-upstream",
  "behind-upstream",
  "dirty-release-branch",
]);
export type KanbanConsoleGitPolicyViolationKind = typeof KanbanConsoleGitPolicyViolationKind.Type;

export const KanbanConsoleTransitionActionKind = Schema.Literals([
  "none",
  "open-action-sheet",
  "queue-agent-workflow",
  "blocked",
]);
export type KanbanConsoleTransitionActionKind = typeof KanbanConsoleTransitionActionKind.Type;

export const KanbanConsolePrWatchHealth = Schema.Literals(["green", "attention", "pending"]);
export type KanbanConsolePrWatchHealth = typeof KanbanConsolePrWatchHealth.Type;

export const KanbanConsoleCheckSummary = Schema.Struct({
  passing: NonNegativeInt,
  pending: NonNegativeInt,
  failing: NonNegativeInt,
});
export type KanbanConsoleCheckSummary = typeof KanbanConsoleCheckSummary.Type;

export const KanbanConsoleManagedRepo = Schema.Struct({
  id: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  owner: TrimmedNonEmptyString,
  path: TrimmedNonEmptyString,
  branch: TrimmedNonEmptyString,
  ahead: NonNegativeInt,
  behind: NonNegativeInt,
  openPrs: NonNegativeInt,
  activeTasks: NonNegativeInt,
  status: KanbanConsoleRepoStatus,
});
export type KanbanConsoleManagedRepo = typeof KanbanConsoleManagedRepo.Type;

export const KanbanConsoleProjectBoard = Schema.Struct({
  id: TrimmedNonEmptyString,
  owner: TrimmedNonEmptyString,
  title: TrimmedNonEmptyString,
  source: Schema.Literal("github-projects"),
  columns: Schema.Array(KanbanColumnId),
});
export type KanbanConsoleProjectBoard = typeof KanbanConsoleProjectBoard.Type;

export const KanbanConsoleTask = Schema.Struct({
  id: TrimmedNonEmptyString,
  issue: TrimmedNonEmptyString,
  title: TrimmedNonEmptyString,
  titleAr: TrimmedNonEmptyString,
  repo: TrimmedNonEmptyString,
  column: KanbanColumnId,
  priority: KanbanConsolePriority,
  assignee: TrimmedNonEmptyString,
  pr: Schema.optional(TrimmedNonEmptyString),
  checks: KanbanConsoleCheckSummary,
  agent: KanbanConsoleAgentKind,
  agentSessionStatus: Schema.optional(KanbanConsoleAgentSessionStatus),
  updated: IsoDateTime,
  comments: NonNegativeInt,
});
export type KanbanConsoleTask = typeof KanbanConsoleTask.Type;

export const KanbanConsoleTaskTransitionRequest = Schema.Struct({
  taskId: TrimmedNonEmptyString,
  fromColumn: KanbanColumnId,
  toColumn: KanbanColumnId,
  confirmed: Schema.Boolean,
});
export type KanbanConsoleTaskTransitionRequest = typeof KanbanConsoleTaskTransitionRequest.Type;

export const KanbanConsoleTaskTransitionResult = Schema.Struct({
  taskId: TrimmedNonEmptyString,
  fromColumn: KanbanColumnId,
  toColumn: KanbanColumnId,
  action: KanbanConsoleTransitionActionKind,
  requiresConfirmation: Schema.Boolean,
  duplicateSuppressed: Schema.Boolean,
  message: TrimmedNonEmptyString,
});
export type KanbanConsoleTaskTransitionResult = typeof KanbanConsoleTaskTransitionResult.Type;

export const KanbanConsoleCheckRun = Schema.Struct({
  id: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  status: KanbanConsoleCheckStatus,
  url: Schema.optional(TrimmedNonEmptyString),
});
export type KanbanConsoleCheckRun = typeof KanbanConsoleCheckRun.Type;

export const KanbanConsoleReviewSignal = Schema.Struct({
  id: TrimmedNonEmptyString,
  kind: KanbanConsoleReviewSignalKind,
  sourceKind: Schema.optional(KanbanConsolePrWatchSignalSource),
  source: TrimmedNonEmptyString,
  summary: TrimmedNonEmptyString,
  fingerprint: TrimmedNonEmptyString,
  url: Schema.optional(TrimmedNonEmptyString),
  trusted: Schema.optional(Schema.Boolean),
  duplicateSuppressed: Schema.optional(Schema.Boolean),
  createdAt: IsoDateTime,
});
export type KanbanConsoleReviewSignal = typeof KanbanConsoleReviewSignal.Type;

export const KanbanConsolePullRequestWatch = Schema.Struct({
  id: TrimmedNonEmptyString,
  repo: TrimmedNonEmptyString,
  pr: TrimmedNonEmptyString,
  title: TrimmedNonEmptyString,
  taskId: TrimmedNonEmptyString,
  pollingIntervalSeconds: Schema.optional(PositiveInt),
  actionCommentPolicy: Schema.optional(KanbanConsoleActionCommentPolicy),
  checks: Schema.Array(KanbanConsoleCheckRun),
  reviewSignals: Schema.Array(KanbanConsoleReviewSignal),
  lastSeenAt: IsoDateTime,
});
export type KanbanConsolePullRequestWatch = typeof KanbanConsolePullRequestWatch.Type;

export const KanbanConsoleSuggestedFix = Schema.Struct({
  id: TrimmedNonEmptyString,
  taskId: TrimmedNonEmptyString,
  prWatchId: TrimmedNonEmptyString,
  title: TrimmedNonEmptyString,
  command: TrimmedNonEmptyString,
  status: KanbanConsoleSuggestedFixStatus,
  guardrails: Schema.Array(TrimmedNonEmptyString),
  prompt: Schema.optional(TrimmedNonEmptyString),
  sourceSignalIds: Schema.optional(Schema.Array(TrimmedNonEmptyString)),
});
export type KanbanConsoleSuggestedFix = typeof KanbanConsoleSuggestedFix.Type;

export const KanbanConsolePrWatchActionComment = Schema.Struct({
  id: TrimmedNonEmptyString,
  prWatchId: TrimmedNonEmptyString,
  policy: KanbanConsoleActionCommentPolicy,
  body: TrimmedNonEmptyString,
  materialStateChanged: Schema.Boolean,
  duplicateSuppressed: Schema.Boolean,
  updatedAt: IsoDateTime,
});
export type KanbanConsolePrWatchActionComment = typeof KanbanConsolePrWatchActionComment.Type;

export const KanbanConsoleAutoFixPolicy = Schema.Struct({
  trustedSources: Schema.Array(TrimmedNonEmptyString),
  maxAttemptsPerFingerprint: PositiveInt,
  pauseLabels: Schema.Array(TrimmedNonEmptyString),
  protectedBranches: Schema.Array(TrimmedNonEmptyString),
  allowedBranchPrefixes: Schema.Array(TrimmedNonEmptyString),
  requiredValidationCommands: Schema.Array(TrimmedNonEmptyString),
  aiLoopCredentialsConfigured: Schema.Boolean,
});
export type KanbanConsoleAutoFixPolicy = typeof KanbanConsoleAutoFixPolicy.Type;

export const KanbanConsoleAutoFixAttemptRecord = Schema.Struct({
  fingerprint: TrimmedNonEmptyString,
  attemptsUsed: NonNegativeInt,
  maxAttempts: PositiveInt,
});
export type KanbanConsoleAutoFixAttemptRecord = typeof KanbanConsoleAutoFixAttemptRecord.Type;

export const KanbanConsoleAutoFixGate = Schema.Struct({
  id: TrimmedNonEmptyString,
  kind: KanbanConsoleAutoFixGateKind,
  status: KanbanConsoleAutoFixGateStatus,
  message: TrimmedNonEmptyString,
});
export type KanbanConsoleAutoFixGate = typeof KanbanConsoleAutoFixGate.Type;

export const KanbanConsoleAutoFixRun = Schema.Struct({
  id: TrimmedNonEmptyString,
  taskId: TrimmedNonEmptyString,
  suggestedFixId: TrimmedNonEmptyString,
  prWatchId: TrimmedNonEmptyString,
  command: TrimmedNonEmptyString,
  status: KanbanConsoleAutoFixStatus,
  fingerprint: TrimmedNonEmptyString,
  branch: TrimmedNonEmptyString,
  attemptsUsed: NonNegativeInt,
  maxAttempts: PositiveInt,
  validationCommands: Schema.Array(TrimmedNonEmptyString),
  gates: Schema.Array(KanbanConsoleAutoFixGate),
  sourceSignalIds: Schema.Array(TrimmedNonEmptyString),
  sessionId: Schema.optional(TrimmedNonEmptyString),
  summary: TrimmedNonEmptyString,
  updatedAt: IsoDateTime,
});
export type KanbanConsoleAutoFixRun = typeof KanbanConsoleAutoFixRun.Type;

export const KanbanConsoleCliAdapter = Schema.Struct({
  id: KanbanConsoleCliToolId,
  label: TrimmedNonEmptyString,
  command: TrimmedNonEmptyString,
  availability: KanbanConsoleCliAdapterAvailability,
  mutationPolicy: KanbanConsoleCliMutationPolicy,
  timeoutMs: PositiveInt,
});
export type KanbanConsoleCliAdapter = typeof KanbanConsoleCliAdapter.Type;

export const KanbanConsoleCliAuditRecord = Schema.Struct({
  id: TrimmedNonEmptyString,
  tool: KanbanConsoleCliToolId,
  command: TrimmedNonEmptyString,
  args: Schema.Array(Schema.String),
  cwd: TrimmedNonEmptyString,
  status: KanbanConsoleCliAuditStatus,
  mutates: Schema.Boolean,
  confirmed: Schema.Boolean,
  startedAt: IsoDateTime,
  completedAt: IsoDateTime,
  durationMs: NonNegativeInt,
  exitCode: Schema.optional(NonNegativeInt),
  stdoutTruncated: Schema.Boolean,
  stderrTruncated: Schema.Boolean,
});
export type KanbanConsoleCliAuditRecord = typeof KanbanConsoleCliAuditRecord.Type;

export const KanbanConsoleCliExecutionResult = Schema.Struct({
  tool: KanbanConsoleCliToolId,
  exitCode: NonNegativeInt,
  stdout: Schema.String,
  stderr: Schema.String,
  audit: KanbanConsoleCliAuditRecord,
});
export type KanbanConsoleCliExecutionResult = typeof KanbanConsoleCliExecutionResult.Type;

export const KanbanConsoleCommandRun = Schema.Struct({
  id: TrimmedNonEmptyString,
  label: TrimmedNonEmptyString,
  command: TrimmedNonEmptyString,
  status: KanbanConsoleCommandRunStatus,
  startedAt: Schema.optional(IsoDateTime),
  finishedAt: Schema.optional(IsoDateTime),
});
export type KanbanConsoleCommandRun = typeof KanbanConsoleCommandRun.Type;

export const KanbanConsoleGitFileStatus = Schema.Struct({
  path: TrimmedNonEmptyString,
  sourcePath: Schema.optional(TrimmedNonEmptyString),
  status: Schema.Literals(["staged", "unstaged", "untracked"]),
  change: Schema.optional(KanbanConsoleGitFileChangeKind),
  additions: NonNegativeInt,
  deletions: NonNegativeInt,
  diffAvailable: Schema.optional(Schema.Boolean),
  hunkStaging: Schema.optional(KanbanConsoleGitHunkStagingSupport),
});
export type KanbanConsoleGitFileStatus = typeof KanbanConsoleGitFileStatus.Type;

export const KanbanConsoleGitPolicyViolation = Schema.Struct({
  id: TrimmedNonEmptyString,
  kind: KanbanConsoleGitPolicyViolationKind,
  severity: Schema.Literals(["warning", "blocked"]),
  message: TrimmedNonEmptyString,
});
export type KanbanConsoleGitPolicyViolation = typeof KanbanConsoleGitPolicyViolation.Type;

export const KanbanConsoleGitStatusSnapshot = Schema.Struct({
  repoId: TrimmedNonEmptyString,
  cwd: Schema.optional(TrimmedNonEmptyString),
  isRepo: Schema.optional(Schema.Boolean),
  branch: TrimmedNonEmptyString,
  upstream: Schema.optional(TrimmedNonEmptyString),
  ahead: NonNegativeInt,
  behind: NonNegativeInt,
  aheadOfDefault: Schema.optional(NonNegativeInt),
  files: Schema.Array(KanbanConsoleGitFileStatus),
  policyViolations: Schema.optional(Schema.Array(KanbanConsoleGitPolicyViolation)),
});
export type KanbanConsoleGitStatusSnapshot = typeof KanbanConsoleGitStatusSnapshot.Type;

export const KanbanConsoleGitFileDiff = Schema.Struct({
  repoId: TrimmedNonEmptyString,
  path: TrimmedNonEmptyString,
  status: Schema.Literals(["staged", "unstaged", "untracked"]),
  diff: TrimmedNonEmptyString,
  truncated: Schema.Boolean,
});
export type KanbanConsoleGitFileDiff = typeof KanbanConsoleGitFileDiff.Type;

export const KanbanConsoleGitFileActionRequest = Schema.Struct({
  repoId: TrimmedNonEmptyString,
  cwd: TrimmedNonEmptyString,
  paths: Schema.Array(TrimmedNonEmptyString).check(Schema.isMinLength(1)),
  confirmed: Schema.Boolean,
});
export type KanbanConsoleGitFileActionRequest = typeof KanbanConsoleGitFileActionRequest.Type;

export const KanbanConsoleGitFileActionResult = Schema.Struct({
  repoId: TrimmedNonEmptyString,
  paths: Schema.Array(TrimmedNonEmptyString),
  action: Schema.Literals(["stage", "unstage"]),
  status: Schema.Literals(["applied", "blocked"]),
  message: TrimmedNonEmptyString,
});
export type KanbanConsoleGitFileActionResult = typeof KanbanConsoleGitFileActionResult.Type;

export const KanbanConsoleArtifact = Schema.Struct({
  id: TrimmedNonEmptyString,
  repoId: TrimmedNonEmptyString,
  path: TrimmedNonEmptyString,
  title: TrimmedNonEmptyString,
  status: KanbanConsoleArtifactStatus,
  updatedAt: IsoDateTime,
});
export type KanbanConsoleArtifact = typeof KanbanConsoleArtifact.Type;

export const KanbanConsoleArtifactContent = Schema.Struct({
  repoId: TrimmedNonEmptyString,
  path: TrimmedNonEmptyString,
  title: TrimmedNonEmptyString,
  status: KanbanConsoleArtifactStatus,
  updatedAt: IsoDateTime,
  content: Schema.String,
  preview: Schema.String,
});
export type KanbanConsoleArtifactContent = typeof KanbanConsoleArtifactContent.Type;

export const KanbanConsoleArtifactWriteRequest = Schema.Struct({
  repoId: TrimmedNonEmptyString,
  cwd: TrimmedNonEmptyString,
  path: TrimmedNonEmptyString,
  content: Schema.String,
  confirmed: Schema.Boolean,
  linkedRepository: Schema.optional(TrimmedNonEmptyString),
  linkedIssueNumber: Schema.optional(NonNegativeInt),
  linkedPullRequestNumber: Schema.optional(NonNegativeInt),
});
export type KanbanConsoleArtifactWriteRequest = typeof KanbanConsoleArtifactWriteRequest.Type;

export const KanbanConsoleArtifactWriteResult = Schema.Struct({
  repoId: TrimmedNonEmptyString,
  path: TrimmedNonEmptyString,
  status: KanbanConsoleArtifactWriteStatus,
  message: TrimmedNonEmptyString,
  commentTarget: Schema.optional(TrimmedNonEmptyString),
});
export type KanbanConsoleArtifactWriteResult = typeof KanbanConsoleArtifactWriteResult.Type;

export const KanbanConsoleGitOpsPolicy = Schema.Struct({
  protectedBranches: Schema.Array(TrimmedNonEmptyString),
  allowedWorkBranchPrefixes: Schema.Array(TrimmedNonEmptyString),
  destructiveActionsRequireSecondConfirmation: Schema.Boolean,
});
export type KanbanConsoleGitOpsPolicy = typeof KanbanConsoleGitOpsPolicy.Type;

export const KanbanConsoleReleaseNote = Schema.Struct({
  id: TrimmedNonEmptyString,
  source: Schema.Literals(["issue", "pull-request", "artifact"]),
  title: TrimmedNonEmptyString,
  url: Schema.optional(TrimmedNonEmptyString),
});
export type KanbanConsoleReleaseNote = typeof KanbanConsoleReleaseNote.Type;

export const KanbanConsoleReleaseRequiredCheck = Schema.Struct({
  id: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  status: KanbanConsoleCheckStatus,
  url: Schema.optional(TrimmedNonEmptyString),
});
export type KanbanConsoleReleaseRequiredCheck = typeof KanbanConsoleReleaseRequiredCheck.Type;

export const KanbanConsoleReleaseReviewState = Schema.Struct({
  status: KanbanConsoleReleaseReviewStatus,
  approvals: NonNegativeInt,
  changesRequested: NonNegativeInt,
  pendingReviewers: NonNegativeInt,
});
export type KanbanConsoleReleaseReviewState = typeof KanbanConsoleReleaseReviewState.Type;

export const KanbanConsoleReleaseDeploymentProvider = Schema.Struct({
  id: TrimmedNonEmptyString,
  label: TrimmedNonEmptyString,
  status: KanbanConsoleReleaseGateStatus,
  detail: Schema.optional(TrimmedNonEmptyString),
});
export type KanbanConsoleReleaseDeploymentProvider =
  typeof KanbanConsoleReleaseDeploymentProvider.Type;

export const KanbanConsoleReleaseActionComment = Schema.Struct({
  id: TrimmedNonEmptyString,
  target: TrimmedNonEmptyString,
  body: TrimmedNonEmptyString,
  updatedAt: IsoDateTime,
});
export type KanbanConsoleReleaseActionComment = typeof KanbanConsoleReleaseActionComment.Type;

export const KanbanConsoleReleaseActionRequest = Schema.Struct({
  kind: KanbanConsoleReleaseActionKind,
  repository: TrimmedNonEmptyString,
  targetNumber: NonNegativeInt,
  confirmed: Schema.Boolean,
  secondConfirmed: Schema.optional(Schema.Boolean),
});
export type KanbanConsoleReleaseActionRequest = typeof KanbanConsoleReleaseActionRequest.Type;

export const KanbanConsoleReleaseActionResult = Schema.Struct({
  kind: KanbanConsoleReleaseActionKind,
  status: KanbanConsoleReleaseActionStatus,
  message: TrimmedNonEmptyString,
  requiresConfirmation: Schema.Boolean,
  requiresSecondConfirmation: Schema.Boolean,
  commentTarget: Schema.optional(TrimmedNonEmptyString),
});
export type KanbanConsoleReleaseActionResult = typeof KanbanConsoleReleaseActionResult.Type;

export const KanbanConsoleReleaseReadiness = Schema.Struct({
  branch: TrimmedNonEmptyString,
  latestTag: Schema.optional(TrimmedNonEmptyString),
  targetTag: Schema.optional(TrimmedNonEmptyString),
  policy: Schema.optional(
    Schema.Struct({
      prepareOnly: Schema.Boolean,
      mergeRequiresConfirmation: Schema.Boolean,
      deployRequiresConfirmation: Schema.Boolean,
      tagRequiresConfirmation: Schema.Boolean,
      destructiveActionsRequireSecondConfirmation: Schema.Boolean,
    }),
  ),
  gates: Schema.Array(
    Schema.Struct({
      id: TrimmedNonEmptyString,
      label: TrimmedNonEmptyString,
      status: KanbanConsoleReleaseGateStatus,
    }),
  ),
  notes: Schema.optional(Schema.Array(KanbanConsoleReleaseNote)),
  requiredChecks: Schema.optional(Schema.Array(KanbanConsoleReleaseRequiredCheck)),
  reviewState: Schema.optional(KanbanConsoleReleaseReviewState),
  deploymentProviders: Schema.optional(Schema.Array(KanbanConsoleReleaseDeploymentProvider)),
  actionComment: Schema.optional(KanbanConsoleReleaseActionComment),
  actions: Schema.optional(Schema.Array(KanbanConsoleReleaseActionResult)),
});
export type KanbanConsoleReleaseReadiness = typeof KanbanConsoleReleaseReadiness.Type;

export const KanbanConsoleAgentWorkflow = Schema.Struct({
  id: TrimmedNonEmptyString,
  label: TrimmedNonEmptyString,
  agent: KanbanConsoleAgentKind,
  command: TrimmedNonEmptyString,
  commandId: Schema.optional(KanbanConsoleAgentWorkflowCommandId),
  available: Schema.Boolean,
});
export type KanbanConsoleAgentWorkflow = typeof KanbanConsoleAgentWorkflow.Type;

export const KanbanConsoleTaskContextPackage = Schema.Struct({
  task: Schema.Struct({
    id: TrimmedNonEmptyString,
    issue: TrimmedNonEmptyString,
    title: TrimmedNonEmptyString,
    repo: TrimmedNonEmptyString,
    column: KanbanColumnId,
    priority: KanbanConsolePriority,
  }),
  project: Schema.Struct({
    id: TrimmedNonEmptyString,
    owner: TrimmedNonEmptyString,
    title: TrimmedNonEmptyString,
  }),
  repo: Schema.Struct({
    id: TrimmedNonEmptyString,
    owner: TrimmedNonEmptyString,
    name: TrimmedNonEmptyString,
    path: TrimmedNonEmptyString,
    branch: TrimmedNonEmptyString,
  }),
  issueUrl: TrimmedNonEmptyString,
  prUrl: Schema.optional(TrimmedNonEmptyString),
  artifacts: Schema.Array(
    Schema.Struct({
      path: TrimmedNonEmptyString,
      status: KanbanConsoleArtifactStatus,
    }),
  ),
  gitStatus: Schema.optional(KanbanConsoleGitStatusSnapshot),
  validationCommands: Schema.Array(TrimmedNonEmptyString),
  governanceRules: Schema.Array(TrimmedNonEmptyString),
});
export type KanbanConsoleTaskContextPackage = typeof KanbanConsoleTaskContextPackage.Type;

export const KanbanConsoleAgentWorkflowSession = Schema.Struct({
  id: TrimmedNonEmptyString,
  taskId: TrimmedNonEmptyString,
  workflowId: TrimmedNonEmptyString,
  agent: KanbanConsoleAgentKind,
  command: TrimmedNonEmptyString,
  status: KanbanConsoleAgentSessionStatus,
  duplicateKey: TrimmedNonEmptyString,
  duplicateSuppressed: Schema.Boolean,
  summary: TrimmedNonEmptyString,
  startedAt: Schema.optional(IsoDateTime),
  finishedAt: Schema.optional(IsoDateTime),
});
export type KanbanConsoleAgentWorkflowSession = typeof KanbanConsoleAgentWorkflowSession.Type;

export const KanbanConsoleSnapshot = Schema.Struct({
  version: Schema.Literal(1),
  generatedAt: IsoDateTime,
  locale: KanbanConsoleLocale,
  repos: Schema.Array(KanbanConsoleManagedRepo),
  boards: Schema.Array(KanbanConsoleProjectBoard),
  tasks: Schema.Array(KanbanConsoleTask),
  prWatches: Schema.Array(KanbanConsolePullRequestWatch),
  suggestedFixes: Schema.Array(KanbanConsoleSuggestedFix),
  commandRuns: Schema.Array(KanbanConsoleCommandRun),
  gitStatuses: Schema.Array(KanbanConsoleGitStatusSnapshot),
  artifacts: Schema.Array(KanbanConsoleArtifact),
  gitOpsPolicy: KanbanConsoleGitOpsPolicy,
  releaseReadiness: KanbanConsoleReleaseReadiness,
  agentWorkflows: Schema.Array(KanbanConsoleAgentWorkflow),
  agentSessions: Schema.optional(Schema.Array(KanbanConsoleAgentWorkflowSession)),
  autoFixRuns: Schema.optional(Schema.Array(KanbanConsoleAutoFixRun)),
  cliAdapters: Schema.optional(Schema.Array(KanbanConsoleCliAdapter)),
  cliAudit: Schema.optional(Schema.Array(KanbanConsoleCliAuditRecord)),
});
export type KanbanConsoleSnapshot = typeof KanbanConsoleSnapshot.Type;
