import type {
  KanbanColumnId,
  KanbanConsoleAgentWorkflow,
  KanbanConsoleAgentWorkflowSession,
  KanbanConsoleArtifact,
  KanbanConsoleAutoFixRun,
  KanbanConsoleCommandRun,
  KanbanConsoleGitOpsPolicy,
  KanbanConsoleGitStatusSnapshot,
  KanbanConsoleLocale,
  KanbanConsoleManagedRepo,
  KanbanConsolePrWatchHealth,
  KanbanConsoleProjectBoard,
  KanbanConsolePullRequestWatch,
  KanbanConsoleReleaseReadiness,
  KanbanConsoleSnapshot,
  KanbanConsoleSuggestedFix,
  KanbanConsoleTask,
  KanbanConsoleTaskTransitionRequest,
  KanbanConsoleTaskTransitionResult,
} from "@t3tools/contracts";

export type {
  KanbanColumnId,
  KanbanConsoleAgentWorkflowSession,
  KanbanConsoleLocale,
  KanbanConsolePrWatchHealth,
  KanbanConsolePullRequestWatch,
  KanbanConsoleSnapshot,
  KanbanConsoleSuggestedFix,
  KanbanConsoleTaskTransitionRequest,
  KanbanConsoleTaskTransitionResult,
};

export type ConsoleStateId = "empty" | "loading" | "permission" | "missing-auth" | "error";

export type ConsoleViewId =
  | "board"
  | "git"
  | "artifacts"
  | "prs"
  | "timeline"
  | "cli"
  | "gitops"
  | "settings"
  | "states";

export type KanbanTaskMock = KanbanConsoleTask;
export type MonorepoMock = KanbanConsoleManagedRepo;

export const kanbanColumns: Array<{
  id: KanbanColumnId;
  labelKey: keyof typeof kanbanConsoleMessages.en;
}> = [
  { id: "backlog", labelKey: "columnBacklog" },
  { id: "ready", labelKey: "columnReady" },
  { id: "in-progress", labelKey: "columnProgress" },
  { id: "review", labelKey: "columnReview" },
  { id: "blocked", labelKey: "columnBlocked" },
  { id: "done", labelKey: "columnDone" },
];

export const consoleViews: Array<{
  id: ConsoleViewId;
  labelKey: keyof typeof kanbanConsoleMessages.en;
}> = [
  { id: "board", labelKey: "viewBoard" },
  { id: "git", labelKey: "viewGit" },
  { id: "artifacts", labelKey: "viewArtifacts" },
  { id: "prs", labelKey: "viewPrs" },
  { id: "timeline", labelKey: "viewTimeline" },
  { id: "cli", labelKey: "viewCli" },
  { id: "gitops", labelKey: "viewGitops" },
  { id: "settings", labelKey: "viewSettings" },
  { id: "states", labelKey: "viewStates" },
];

export const consoleStateIds: ConsoleStateId[] = [
  "empty",
  "loading",
  "permission",
  "missing-auth",
  "error",
];

export const kanbanConsoleMessages = {
  en: {
    actionQueueCommand: "Queue mock command",
    actionMove: "Move",
    actionOpenSheet: "Open move sheet",
    actionPreview: "Preview",
    actionPatchFlow: "Apply guarded patch",
    actionSaveDraft: "Save draft",
    actionSimulate: "Simulate",
    actionWatch: "Watch",
    agentActions: "Agent actions",
    agentSessionStatus: "Agent session",
    artifactsHeading: "Product artifacts",
    artifactBlocked: "Dirty files are blocked before write.",
    artifactClean: "Clean artifact is ready for guarded patch flow.",
    artifactEditLabel: "Artifact markdown editor",
    artifactGuardLabel: "Guard",
    artifactPathLabel: "Path",
    artifactPreviewLabel: "Artifact preview",
    boardHeading: "GitHub Projects board",
    checks: "Checks",
    cliHeading: "CLI command console",
    columnBacklog: "Backlog",
    columnBlocked: "Blocked",
    columnDone: "Done",
    columnProgress: "In progress",
    columnReady: "Ready",
    columnReview: "In review",
    comments: "Comments",
    consoleTitle: "Kanban Project Console",
    detailHeading: "Task detail",
    emptyState: "No tasks match this workspace filter.",
    errorState: "Project sync failed. Retry uses mock data only.",
    gitHeading: "Lazygit-style git status",
    gitopsHeading: "GitOps and release dashboard",
    issueFields: "Issue and project fields",
    loadingState: "Loading project snapshots.",
    missingAuthState: "Connect GitHub before live sync.",
    moveSheetTitle: "Move card",
    permissionState: "Project write permission required.",
    prActionPolicy: "Action comments",
    prActionPolicyNewComment: "New comment",
    prActionPolicySticky: "Sticky",
    prCheckFailing: "Failing",
    prCheckPassing: "Passing",
    prCheckPending: "Pending",
    prCheckSkipped: "Skipped",
    prDuplicateSuppressed: "Duplicate suppressed",
    prFixBlocked: "Blocked",
    prFixEligible: "Eligible",
    prFixNeedsConfirmation: "Needs confirmation",
    prFixQueued: "Queued",
    prPollingInterval: "Polling interval",
    prSignalApproval: "Approval",
    prSignalChangeRequest: "Change request",
    prSignalCiFailure: "CI failure",
    prSignalIssueComment: "Issue comment",
    prSignalReviewComment: "Review comment",
    prsHeading: "PR watcher",
    prSuggestedFixes: "Suggested fixes",
    prTrustedSource: "Trusted source",
    prWatcherSignals: "Signals",
    releaseActions: "Release actions",
    releaseActionDeploy: "Deploy",
    releaseActionMerge: "Merge",
    releaseActionPrepareComment: "Prepare comment",
    releaseActionTag: "Tag",
    releaseBranch: "Branch",
    releaseDeployment: "Deployment readiness",
    releaseGateCleanWorktree: "Clean worktree",
    releaseGateDeploymentProviders: "Deployment providers",
    releaseGatePolicy: "Protected branch policy",
    releaseGateReleaseBranch: "Release branch",
    releaseGateReleaseBranchPolicy: "Release branch policy",
    releaseGateReleaseNotesDraft: "Release notes draft",
    releaseGateReleaseSmoke: "Release smoke",
    releaseGateRequiredChecks: "Required checks",
    releaseGateReviewState: "Review state",
    releaseGateTagReadiness: "Tag readiness",
    releaseGateValidate: "Validate",
    releaseLatestTag: "Latest tag",
    releaseNotes: "Release notes draft",
    releasePolicy: "Prepare-only release policy",
    releasePolicyEnabled: "Enabled",
    releasePolicyMissing: "Not configured",
    releaseSourceArtifact: "Artifact",
    releaseSourceIssue: "Issue",
    releaseSourcePullRequest: "Pull request",
    releaseStatusBlocked: "Blocked",
    releaseStatusCommented: "Commented",
    releaseStatusPending: "Pending",
    releaseStatusPassing: "Passing",
    releaseStatusReady: "Ready",
    releaseReview: "Review state",
    releaseReviewApprovals: "Approvals",
    releaseReviewChanges: "Change requests",
    releaseReviewApproved: "Approved",
    releaseReviewBlocked: "Blocked",
    releaseReviewChangesRequested: "Changes requested",
    releaseReviewPending: "Pending",
    releaseReviewStatus: "Status",
    releaseTargetTag: "Target tag",
    releaseUpdatedComment: "Prepared comment",
    releaseChecks: "Required checks",
    settingsHeading: "Console settings",
    sidebarHeading: "Registered monorepos",
    statesHeading: "State previews",
    timelineHeading: "Issue and PR timeline",
    viewArtifacts: "Artifacts",
    viewBoard: "Board",
    viewCli: "CLI",
    viewGit: "Git",
    viewGitops: "GitOps",
    viewPrs: "PRs",
    viewSettings: "Settings",
    viewStates: "States",
    viewTimeline: "Timeline",
  },
  ar: {
    actionQueueCommand: "إضافة أمر تجريبي",
    actionMove: "نقل",
    actionOpenSheet: "فتح لوحة النقل",
    actionPreview: "معاينة",
    actionPatchFlow: "تطبيق تعديل محمي",
    actionSaveDraft: "حفظ مسودة",
    actionSimulate: "محاكاة",
    actionWatch: "مراقبة",
    agentActions: "إجراءات الوكيل",
    agentSessionStatus: "حالة جلسة الوكيل",
    artifactsHeading: "مستندات المنتج",
    artifactBlocked: "يتم حظر الملفات المعدلة قبل الكتابة.",
    artifactClean: "المستند النظيف جاهز لمسار تعديل محمي.",
    artifactEditLabel: "محرر Markdown للمستند",
    artifactGuardLabel: "الحماية",
    artifactPathLabel: "المسار",
    artifactPreviewLabel: "معاينة المستند",
    boardHeading: "لوحة مشاريع GitHub",
    checks: "الفحوصات",
    cliHeading: "وحدة أوامر CLI",
    columnBacklog: "المهام المؤجلة",
    columnBlocked: "محظور",
    columnDone: "منجز",
    columnProgress: "قيد التنفيذ",
    columnReady: "جاهز",
    columnReview: "قيد المراجعة",
    comments: "التعليقات",
    consoleTitle: "وحدة تحكم مشروع كانبان",
    detailHeading: "تفاصيل المهمة",
    emptyState: "لا توجد مهام تطابق فلتر مساحة العمل.",
    errorState: "فشلت مزامنة المشروع. إعادة المحاولة تستخدم بيانات تجريبية فقط.",
    gitHeading: "حالة Git بنمط Lazygit",
    gitopsHeading: "لوحة GitOps والإصدارات",
    issueFields: "حقول المشكلة والمشروع",
    loadingState: "جار تحميل لقطات المشروع.",
    missingAuthState: "اربط GitHub قبل المزامنة الحية.",
    moveSheetTitle: "نقل البطاقة",
    permissionState: "صلاحية الكتابة على المشروع مطلوبة.",
    prActionPolicy: "تعليقات الإجراءات",
    prActionPolicyNewComment: "تعليق جديد",
    prActionPolicySticky: "مثبت",
    prCheckFailing: "فاشل",
    prCheckPassing: "ناجح",
    prCheckPending: "قيد الانتظار",
    prCheckSkipped: "تم تخطيه",
    prDuplicateSuppressed: "تم منع التكرار",
    prFixBlocked: "محظور",
    prFixEligible: "مؤهل",
    prFixNeedsConfirmation: "يتطلب تأكيدا",
    prFixQueued: "في الطابور",
    prPollingInterval: "فاصل المراقبة",
    prSignalApproval: "موافقة",
    prSignalChangeRequest: "طلب تغييرات",
    prSignalCiFailure: "فشل CI",
    prSignalIssueComment: "تعليق مشكلة",
    prSignalReviewComment: "تعليق مراجعة",
    prsHeading: "مراقب طلبات السحب",
    prSuggestedFixes: "إصلاحات مقترحة",
    prTrustedSource: "مصدر موثوق",
    prWatcherSignals: "الإشارات",
    releaseActions: "إجراءات الإصدار",
    releaseActionDeploy: "نشر",
    releaseActionMerge: "دمج",
    releaseActionPrepareComment: "تحضير تعليق",
    releaseActionTag: "إنشاء وسم",
    releaseBranch: "الفرع",
    releaseDeployment: "جاهزية النشر",
    releaseGateCleanWorktree: "نظافة مساحة العمل",
    releaseGateDeploymentProviders: "مزودو النشر",
    releaseGatePolicy: "سياسة الفرع المحمي",
    releaseGateReleaseBranch: "فرع الإصدار",
    releaseGateReleaseBranchPolicy: "سياسة فرع الإصدار",
    releaseGateReleaseNotesDraft: "مسودة ملاحظات الإصدار",
    releaseGateReleaseSmoke: "فحص الإصدار",
    releaseGateRequiredChecks: "الفحوصات المطلوبة",
    releaseGateReviewState: "حالة المراجعة",
    releaseGateTagReadiness: "جاهزية الوسم",
    releaseGateValidate: "التحقق",
    releaseLatestTag: "آخر وسم",
    releaseNotes: "مسودة ملاحظات الإصدار",
    releasePolicy: "سياسة إصدار للتحضير فقط",
    releasePolicyEnabled: "مفعلة",
    releasePolicyMissing: "غير مهيأة",
    releaseSourceArtifact: "مستند",
    releaseSourceIssue: "مشكلة",
    releaseSourcePullRequest: "طلب سحب",
    releaseStatusBlocked: "محظور",
    releaseStatusCommented: "تم التعليق",
    releaseStatusPending: "قيد الانتظار",
    releaseStatusPassing: "ناجح",
    releaseStatusReady: "جاهز",
    releaseReview: "حالة المراجعة",
    releaseReviewApprovals: "الموافقات",
    releaseReviewChanges: "طلبات التغيير",
    releaseReviewApproved: "تمت الموافقة",
    releaseReviewBlocked: "محظور",
    releaseReviewChangesRequested: "تغييرات مطلوبة",
    releaseReviewPending: "قيد الانتظار",
    releaseReviewStatus: "الحالة",
    releaseTargetTag: "وسم الهدف",
    releaseUpdatedComment: "تعليق محضر",
    releaseChecks: "الفحوصات المطلوبة",
    settingsHeading: "إعدادات وحدة التحكم",
    sidebarHeading: "مستودعات Monorepo المسجلة",
    statesHeading: "معاينات الحالات",
    timelineHeading: "خط زمني للمشاكل وطلبات السحب",
    viewArtifacts: "المستندات",
    viewBoard: "اللوحة",
    viewCli: "CLI",
    viewGit: "Git",
    viewGitops: "GitOps",
    viewPrs: "طلبات السحب",
    viewSettings: "الإعدادات",
    viewStates: "الحالات",
    viewTimeline: "الخط الزمني",
  },
} as const;

const managedRepos: MonorepoMock[] = [
  {
    id: "repo-kanban-console",
    name: "kanban-console",
    owner: "MohAnghabo",
    path: "/Users/mohanghabo/Projects/kanban-console",
    branch: "feature/t3-kanban-phase-3-contracts",
    ahead: 1,
    behind: 0,
    openPrs: 1,
    activeTasks: 7,
    status: "healthy",
  },
  {
    id: "repo-ai-starter-pro",
    name: "ai-starter-pro",
    owner: "MohAnghabo",
    path: "/Users/mohanghabo/Projects/ai-starter-pro",
    branch: "main",
    ahead: 0,
    behind: 0,
    openPrs: 0,
    activeTasks: 3,
    status: "attention",
  },
  {
    id: "repo-docs-product",
    name: "docs-product",
    owner: "MohAnghabo",
    path: "/Users/mohanghabo/Projects/docs-product",
    branch: "release/product-artifacts",
    ahead: 2,
    behind: 1,
    openPrs: 2,
    activeTasks: 4,
    status: "blocked",
  },
];

const projectBoards: KanbanConsoleProjectBoard[] = [
  {
    id: "board-kanban-console",
    owner: "MohAnghabo",
    title: "Kanban Project Console",
    source: "github-projects",
    columns: kanbanColumns.map((column) => column.id),
  },
];

const tasks: KanbanTaskMock[] = [
  {
    id: "t3-p2-1",
    issue: "ai-starter-pro#43",
    title: "Mock GitHub Projects board and card workflow",
    titleAr: "لوحة مشاريع GitHub التجريبية وسير عمل البطاقات",
    repo: "kanban-console",
    column: "in-progress",
    priority: "P1",
    assignee: "Codex",
    pr: "kanban-console#2",
    checks: { passing: 5, pending: 2, failing: 0 },
    agent: "Codex",
    agentSessionStatus: "queued",
    updated: "2026-05-06T10:20:00.000Z",
    comments: 6,
  },
  {
    id: "t3-p2-2",
    issue: "ai-starter-pro#43",
    title: "Artifact browser for docs/product",
    titleAr: "متصفح مستندات docs/product",
    repo: "kanban-console",
    column: "ready",
    priority: "P2",
    assignee: "Claude",
    checks: { passing: 3, pending: 0, failing: 0 },
    agent: "Claude",
    agentSessionStatus: "blocked",
    updated: "2026-05-06T09:05:00.000Z",
    comments: 2,
  },
  {
    id: "t3-p2-3",
    issue: "kanban-console#pending",
    title: "PR watcher comments and check summaries",
    titleAr: "مراقبة تعليقات طلبات السحب وملخصات الفحوصات",
    repo: "kanban-console",
    column: "review",
    priority: "P1",
    assignee: "Human",
    pr: "kanban-console#1",
    checks: { passing: 12, pending: 0, failing: 1 },
    agent: "Human",
    agentSessionStatus: "failed",
    updated: "2026-05-05T14:44:00.000Z",
    comments: 11,
  },
  {
    id: "t3-p2-4",
    issue: "ai-starter-pro#43",
    title: "Settings for repos, bots, rules, and polling",
    titleAr: "إعدادات المستودعات والروبوتات والقواعد والاستطلاع",
    repo: "ai-starter-pro",
    column: "backlog",
    priority: "P2",
    assignee: "Codex",
    checks: { passing: 0, pending: 0, failing: 0 },
    agent: "Codex",
    updated: "2026-05-05T08:00:00.000Z",
    comments: 1,
  },
  {
    id: "t3-p2-5",
    issue: "kanban-console#mock",
    title: "GitOps release health dashboard",
    titleAr: "لوحة صحة إصدارات GitOps",
    repo: "docs-product",
    column: "blocked",
    priority: "P0",
    assignee: "Human",
    checks: { passing: 4, pending: 1, failing: 2 },
    agent: "Human",
    updated: "2026-05-04T08:00:00.000Z",
    comments: 9,
  },
  {
    id: "t3-p2-6",
    issue: "kanban-console#mock",
    title: "CLI command console with dry-run queue",
    titleAr: "وحدة أوامر CLI مع طابور تنفيذ تجريبي",
    repo: "kanban-console",
    column: "done",
    priority: "P1",
    assignee: "Claude",
    checks: { passing: 8, pending: 0, failing: 0 },
    agent: "Claude",
    updated: "2026-05-03T08:00:00.000Z",
    comments: 4,
  },
];

const prWatches: KanbanConsolePullRequestWatch[] = [
  {
    id: "watch-pr-2",
    repo: "kanban-console",
    pr: "kanban-console#2",
    title: "Add phase 2 mock Kanban console",
    taskId: "t3-p2-1",
    pollingIntervalSeconds: 60,
    actionCommentPolicy: "sticky",
    checks: [
      { id: "check-validate", name: "Validate", status: "passing" },
      { id: "check-release-smoke", name: "Release Smoke", status: "pending" },
    ],
    reviewSignals: [
      {
        id: "signal-rtl",
        kind: "approval",
        sourceKind: "review-summary",
        source: "maintainer",
        summary: "Browser mock was approved after RTL smoke.",
        fingerprint: "approval:phase-2:rtl",
        trusted: true,
        duplicateSuppressed: false,
        createdAt: "2026-05-06T12:50:00.000Z",
      },
    ],
    lastSeenAt: "2026-05-06T13:00:00.000Z",
  },
  {
    id: "watch-pr-1",
    repo: "kanban-console",
    pr: "kanban-console#1",
    title: "Adopt governance baseline",
    taskId: "t3-p2-3",
    pollingIntervalSeconds: 60,
    actionCommentPolicy: "sticky",
    checks: [
      { id: "check-validate-1", name: "Validate", status: "failing" },
      { id: "check-smoke-1", name: "Release Smoke", status: "passing" },
    ],
    reviewSignals: [
      {
        id: "signal-ci",
        kind: "ci-failure",
        sourceKind: "check-run",
        source: "GitHub Actions",
        summary: "Required check failed in a synthetic fixture.",
        fingerprint: "ci:validate:failure",
        trusted: true,
        duplicateSuppressed: false,
        createdAt: "2026-05-06T11:35:00.000Z",
      },
      {
        id: "signal-coderabbit-duplicate",
        kind: "review-comment",
        sourceKind: "review-comment",
        source: "coderabbitai",
        summary: "Actionable review comment already handled in the previous poll.",
        fingerprint: "review-comment:coderabbitai:phase-1-readiness",
        trusted: true,
        duplicateSuppressed: true,
        createdAt: "2026-05-06T11:36:00.000Z",
      },
    ],
    lastSeenAt: "2026-05-06T11:40:00.000Z",
  },
];

const suggestedFixes: KanbanConsoleSuggestedFix[] = [
  {
    id: "fix-pr-1-validate",
    taskId: "t3-p2-3",
    prWatchId: "watch-pr-1",
    title: "Inspect failing Validate check",
    command: "/ship t3-kanban-project-console",
    status: "eligible",
    guardrails: ["requires-confirmation", "redact-logs", "no-project-write"],
    prompt: "Inspect the failing Validate check and propose the smallest safe fix.",
    sourceSignalIds: ["signal-ci"],
  },
  {
    id: "fix-release-policy",
    taskId: "t3-p2-5",
    prWatchId: "watch-pr-2",
    title: "Release branch policy needs maintainer confirmation",
    command: "/orchestrate t3-kanban-project-console",
    status: "blocked",
    guardrails: ["protected-branch", "requires-human"],
    prompt: "Ask for release policy confirmation before suggesting a release workflow change.",
    sourceSignalIds: ["signal-rtl"],
  },
];

const commandRuns: KanbanConsoleCommandRun[] = [
  {
    id: "command-phase-3",
    label: "Phase 3 contracts",
    command: "/phase t3-kanban-project-console phase-3",
    status: "queued",
  },
  {
    id: "command-ship",
    label: "Ship readiness",
    command: "/ship t3-kanban-project-console",
    status: "blocked",
  },
];

const gitStatuses: KanbanConsoleGitStatusSnapshot[] = [
  {
    repoId: "repo-kanban-console",
    cwd: "/Users/mohanghabo/Projects/kanban-console",
    isRepo: true,
    branch: "feature/t3-kanban-phase-3-contracts",
    upstream: "origin/feature/t3-kanban-phase-3-contracts",
    ahead: 1,
    behind: 0,
    aheadOfDefault: 1,
    files: [
      {
        path: "apps/web/src/components/KanbanConsoleMock.tsx",
        status: "unstaged",
        change: "modified",
        additions: 42,
        deletions: 3,
        diffAvailable: true,
        hunkStaging: "supported",
      },
      {
        path: "apps/server/src/kanban/GitStatusProvider.ts",
        status: "staged",
        change: "added",
        additions: 180,
        deletions: 0,
        diffAvailable: true,
        hunkStaging: "supported",
      },
      {
        path: "packages/contracts/src/kanbanConsole.ts",
        status: "untracked",
        change: "added",
        additions: 250,
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
        message: "Branch has no upstream tracking branch in the mock GitOps state.",
      },
    ],
  },
];

const artifacts: KanbanConsoleArtifact[] = [
  {
    id: "artifact-plan",
    repoId: "repo-kanban-console",
    path: "docs/tasks/t3-kanban-project-console.md",
    title: "Kanban console task plan",
    status: "dirty",
    updatedAt: "2026-05-06T13:20:00.000Z",
  },
  {
    id: "artifact-product",
    repoId: "repo-kanban-console",
    path: "docs/product/project-console.md",
    title: "Project console product notes",
    status: "clean",
    updatedAt: "2026-05-06T10:00:00.000Z",
  },
];

const gitOpsPolicy: KanbanConsoleGitOpsPolicy = {
  protectedBranches: ["main", "release/*"],
  allowedWorkBranchPrefixes: [
    "feature/",
    "fix/",
    "chore/",
    "docs/",
    "ops/",
    "refactor/",
    "test/",
    "perf/",
  ],
  destructiveActionsRequireSecondConfirmation: true,
};

const releaseReadiness: KanbanConsoleReleaseReadiness = {
  branch: "release/product-artifacts",
  latestTag: "v0.4.0",
  targetTag: "v0.5.0",
  policy: {
    prepareOnly: true,
    mergeRequiresConfirmation: true,
    deployRequiresConfirmation: true,
    tagRequiresConfirmation: true,
    destructiveActionsRequireSecondConfirmation: true,
  },
  gates: [
    { id: "gate-validate", label: "Validate", status: "passing" },
    { id: "gate-smoke", label: "Release smoke", status: "pending" },
    { id: "gate-tag-readiness", label: "Tag readiness", status: "passing" },
    { id: "gate-policy", label: "Protected branch policy", status: "blocked" },
  ],
  notes: [
    {
      id: "issue-43",
      source: "issue",
      title: "Complete Kanban Console phase workflow",
      url: "https://github.com/MohAnghabo/ai-starter-pro/issues/43",
    },
    {
      id: "pr-22",
      source: "pull-request",
      title: "Add confirmation-gated CLI adapters",
      url: "https://github.com/MohAnghabo/kanban-console/pull/22",
    },
    {
      id: "artifact-release-notes",
      source: "artifact",
      title: "Release notes draft",
    },
  ],
  requiredChecks: [
    { id: "check-validate", name: "Validate", status: "passing" },
    { id: "check-preflight", name: "Preflight", status: "passing" },
    { id: "check-smoke", name: "Release Smoke", status: "pending" },
  ],
  reviewState: {
    status: "approved",
    approvals: 2,
    changesRequested: 0,
    pendingReviewers: 1,
  },
  deploymentProviders: [
    { id: "vercel", label: "Vercel", status: "pending", detail: "Preview deployment queued" },
    { id: "render", label: "Render", status: "passing", detail: "Deploy hook configured" },
  ],
  actionComment: {
    id: "release-comment-43",
    target: "MohAnghabo/kanban-console#43",
    body: "Kanban Console release preparation comment is ready.",
    updatedAt: "2026-05-06T13:30:00.000Z",
  },
  actions: [
    {
      kind: "prepare-comment",
      status: "blocked",
      message: "Release preparation comment requires explicit confirmation.",
      requiresConfirmation: true,
      requiresSecondConfirmation: false,
    },
    {
      kind: "merge",
      status: "blocked",
      message: "Merge requires passing gates and a second confirmation.",
      requiresConfirmation: true,
      requiresSecondConfirmation: true,
    },
    {
      kind: "deploy",
      status: "blocked",
      message: "Deploy requires passing gates and a second confirmation.",
      requiresConfirmation: true,
      requiresSecondConfirmation: true,
    },
    {
      kind: "tag",
      status: "blocked",
      message: "Tag creation requires passing gates and a second confirmation.",
      requiresConfirmation: true,
      requiresSecondConfirmation: true,
    },
  ],
};

const agentWorkflows: KanbanConsoleAgentWorkflow[] = [
  {
    id: "workflow-phase",
    label: "Implement phase",
    agent: "Codex",
    command: "/phase t3-kanban-project-console phase-3",
    commandId: "phase",
    available: true,
  },
  {
    id: "workflow-ship",
    label: "Ship readiness",
    agent: "Claude",
    command: "/ship t3-kanban-project-console",
    commandId: "ship",
    available: true,
  },
  {
    id: "workflow-orchestrate",
    label: "Orchestrate next step",
    agent: "Codex",
    command: "/orchestrate t3-kanban-project-console",
    commandId: "orchestrate",
    available: true,
  },
  {
    id: "workflow-review",
    label: "Review",
    agent: "Claude",
    command: "/review",
    commandId: "review",
    available: false,
  },
];

const agentSessions = [
  {
    id: "agent-session-phase-3",
    taskId: "t3-p2-1",
    workflowId: "workflow-phase",
    agent: "Codex" as const,
    command: "/phase t3-kanban-project-console phase-3",
    status: "queued" as const,
    duplicateKey: "t3-p2-1:workflow-phase:in-progress:feature/t3-kanban-phase-3-contracts",
    duplicateSuppressed: false,
    summary: "Codex workflow queued with a redacted task context package.",
    startedAt: "2026-05-06T13:25:00.000Z",
  },
  {
    id: "agent-session-artifact-blocked",
    taskId: "t3-p2-2",
    workflowId: "workflow-review",
    agent: "Claude" as const,
    command: "/review",
    status: "blocked" as const,
    duplicateKey: "t3-p2-2:workflow-review:ready:feature/t3-kanban-phase-3-contracts",
    duplicateSuppressed: false,
    summary: "Claude workflow is unavailable on this machine.",
    startedAt: "2026-05-06T13:26:00.000Z",
    finishedAt: "2026-05-06T13:26:00.000Z",
  },
];

const autoFixRuns: KanbanConsoleAutoFixRun[] = [
  {
    id: "autofix-fix-pr-1-validate",
    taskId: "t3-p2-3",
    suggestedFixId: "fix-pr-1-validate",
    prWatchId: "watch-pr-1",
    command: "/ship t3-kanban-project-console",
    status: "setup-required",
    fingerprint: "ci:validate:failure",
    branch: "feature/t3-kanban-phase-9-gated-autofix",
    attemptsUsed: 0,
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
      {
        id: "ai-loop-credentials",
        kind: "ai-loop-credentials",
        status: "blocked",
        message: "AI-loop credentials are missing; setup is required.",
      },
    ],
    sourceSignalIds: ["signal-ci"],
    summary: "Auto-fix is blocked until AI-loop credentials are configured.",
    updatedAt: "2026-05-07T02:00:00.000Z",
  },
];

export const kanbanConsoleMockSnapshot: KanbanConsoleSnapshot = {
  version: 1,
  generatedAt: "2026-05-06T13:30:00.000Z",
  locale: "en",
  repos: managedRepos,
  boards: projectBoards,
  tasks,
  prWatches,
  suggestedFixes,
  commandRuns,
  gitStatuses,
  artifacts,
  gitOpsPolicy,
  releaseReadiness,
  agentWorkflows,
  agentSessions,
  autoFixRuns,
};

export interface KanbanConsoleProvider {
  readSnapshot(): KanbanConsoleSnapshot;
  previewTaskTransition(
    request: KanbanConsoleTaskTransitionRequest,
  ): KanbanConsoleTaskTransitionResult;
  listPrWatches(): readonly KanbanConsolePullRequestWatch[];
  listSuggestedFixes(): readonly KanbanConsoleSuggestedFix[];
  listAutoFixRuns(): readonly KanbanConsoleAutoFixRun[];
  listAgentSessions(): readonly KanbanConsoleAgentWorkflowSession[];
  getPrWatchHealth(watch: KanbanConsolePullRequestWatch): KanbanConsolePrWatchHealth;
  isSuggestedFixEligible(fix: KanbanConsoleSuggestedFix): boolean;
}

export const kanbanConsoleMockProvider: KanbanConsoleProvider = {
  readSnapshot() {
    return kanbanConsoleMockSnapshot;
  },
  previewTaskTransition(request) {
    return previewTaskTransition(request);
  },
  listPrWatches() {
    return kanbanConsoleMockSnapshot.prWatches;
  },
  listSuggestedFixes() {
    return kanbanConsoleMockSnapshot.suggestedFixes;
  },
  listAutoFixRuns() {
    return kanbanConsoleMockSnapshot.autoFixRuns ?? [];
  },
  listAgentSessions() {
    return kanbanConsoleMockSnapshot.agentSessions ?? [];
  },
  getPrWatchHealth(watch) {
    return getPrWatchHealth(watch);
  },
  isSuggestedFixEligible(fix) {
    return isSuggestedFixEligible(fix);
  },
};

export const monorepos = kanbanConsoleMockProvider.readSnapshot().repos;
export const kanbanTasks = kanbanConsoleMockProvider.readSnapshot().tasks;

export function getLocaleDirection(locale: KanbanConsoleLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getMessages(locale: KanbanConsoleLocale) {
  return kanbanConsoleMessages[locale];
}

export function getTasksByColumn(tasks: readonly KanbanTaskMock[] = kanbanTasks) {
  return kanbanColumns.map((column) => ({
    id: column.id,
    labelKey: column.labelKey,
    tasks: tasks.filter((task) => task.column === column.id),
  }));
}

export function moveTaskToColumn(
  tasks: readonly KanbanTaskMock[],
  taskId: string,
  nextColumn: KanbanColumnId,
): KanbanTaskMock[] {
  return tasks.map((task) => (task.id === taskId ? { ...task, column: nextColumn } : task));
}

export function previewTaskTransition(
  request: KanbanConsoleTaskTransitionRequest,
): KanbanConsoleTaskTransitionResult {
  if (request.fromColumn === request.toColumn) {
    return {
      taskId: request.taskId,
      fromColumn: request.fromColumn,
      toColumn: request.toColumn,
      action: "none",
      requiresConfirmation: false,
      duplicateSuppressed: true,
      message: "Task is already in the requested column.",
    };
  }

  if (request.toColumn === "done" && !request.confirmed) {
    return {
      taskId: request.taskId,
      fromColumn: request.fromColumn,
      toColumn: request.toColumn,
      action: "open-action-sheet",
      requiresConfirmation: true,
      duplicateSuppressed: false,
      message: "Completion requires release and PR readiness confirmation.",
    };
  }

  if (request.toColumn === "blocked") {
    return {
      taskId: request.taskId,
      fromColumn: request.fromColumn,
      toColumn: request.toColumn,
      action: "open-action-sheet",
      requiresConfirmation: true,
      duplicateSuppressed: false,
      message: "Blocked transitions require a clear blocker reason.",
    };
  }

  return {
    taskId: request.taskId,
    fromColumn: request.fromColumn,
    toColumn: request.toColumn,
    action: "queue-agent-workflow",
    requiresConfirmation: !request.confirmed,
    duplicateSuppressed: false,
    message: "Transition can queue a confirmed agent workflow.",
  };
}

export function getPrWatchHealth(watch: KanbanConsolePullRequestWatch): KanbanConsolePrWatchHealth {
  if (watch.checks.some((check) => check.status === "failing")) {
    return "attention";
  }
  if (watch.checks.some((check) => check.status === "pending")) {
    return "pending";
  }
  return "green";
}

export function isSuggestedFixEligible(fix: KanbanConsoleSuggestedFix): boolean {
  return fix.status === "eligible" && !fix.guardrails.includes("protected-branch");
}

export function getTaskTitle(task: KanbanTaskMock, locale: KanbanConsoleLocale): string {
  return locale === "ar" ? task.titleAr : task.title;
}
