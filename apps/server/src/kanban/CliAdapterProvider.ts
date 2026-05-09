// @effect-diagnostics globalDate:off
// @effect-diagnostics importFromBarrel:off
// Kanban provider code follows the existing service-layer shape from prior phases; Date injection remains testable through provider options.
import { Context, Effect, Layer, Schema } from "effect";
import type {
  KanbanConsoleCliAdapter,
  KanbanConsoleCliAuditRecord,
  KanbanConsoleCliExecutionResult,
  KanbanConsoleCliToolId,
  VcsError,
} from "@t3tools/contracts";

import * as VcsProcess from "../vcs/VcsProcess.ts";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 500_000;
const REDACTED = "[redacted]";
const TOKEN_PATTERN =
  /\b(?:ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]+|glpat-[A-Za-z0-9_-]{20,}|doppler_[A-Za-z0-9_-]{12,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g;
const SECRET_ASSIGNMENT_PATTERN =
  /\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_KEY|AUTH)[A-Z0-9_]*)=([^\s"'`]+)/gi;
const BASH_CONTROL_OPERATOR_PATTERN = /(?:[;&|`]|[<>]|\$\()/;

const ADAPTERS: ReadonlyArray<KanbanConsoleCliAdapter> = [
  {
    id: "gh",
    label: "GitHub CLI",
    command: "gh",
    availability: "available",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    id: "git",
    label: "Git",
    command: "git",
    availability: "available",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    id: "coderabbit",
    label: "CodeRabbit CLI",
    command: "coderabbit",
    availability: "setup-required",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    id: "doppler",
    label: "Doppler CLI",
    command: "doppler",
    availability: "setup-required",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    id: "vercel",
    label: "Vercel CLI",
    command: "vercel",
    availability: "setup-required",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    id: "render",
    label: "Render CLI",
    command: "render",
    availability: "setup-required",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    id: "bun",
    label: "Bun",
    command: "bun",
    availability: "available",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    id: "bash",
    label: "Constrained Bash",
    command: "bash",
    availability: "available",
    mutationPolicy: "requires-confirmation",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
];

export class CliAdapterProviderError extends Schema.TaggedErrorClass<CliAdapterProviderError>()(
  "CliAdapterProviderError",
  {
    operation: Schema.String,
    detail: Schema.String,
    cause: Schema.optional(Schema.Defect),
  },
) {
  override get message(): string {
    return `CLI adapter provider failed in ${this.operation}: ${this.detail}`;
  }
}

export interface CliAdapterExecuteInput {
  readonly tool: KanbanConsoleCliToolId;
  readonly cwd: string;
  readonly args?: ReadonlyArray<string>;
  readonly script?: string;
  readonly allowedBashPrefixes?: ReadonlyArray<string>;
  readonly mutates: boolean;
  readonly confirmed: boolean;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
  readonly env?: NodeJS.ProcessEnv;
}

export interface CliAdapterProviderShape {
  readonly listAdapters: () => ReadonlyArray<KanbanConsoleCliAdapter>;
  readonly execute: (
    input: CliAdapterExecuteInput,
  ) => Effect.Effect<KanbanConsoleCliExecutionResult, CliAdapterProviderError>;
  readonly readAuditLog: () => ReadonlyArray<KanbanConsoleCliAuditRecord>;
}

export class CliAdapterProvider extends Context.Service<
  CliAdapterProvider,
  CliAdapterProviderShape
>()("t3/kanban/CliAdapterProvider") {}

function adapterFor(tool: KanbanConsoleCliToolId): KanbanConsoleCliAdapter {
  const adapter = ADAPTERS.find((item) => item.id === tool);
  if (!adapter) {
    throw new CliAdapterProviderError({
      operation: "adapterFor",
      detail: `Unknown CLI adapter: ${tool}`,
    });
  }
  return adapter;
}

export function redactCliText(value: string): string {
  return value
    .replace(SECRET_ASSIGNMENT_PATTERN, `$1=${REDACTED}`)
    .replace(TOKEN_PATTERN, REDACTED);
}

function redactArgs(args: ReadonlyArray<string>): ReadonlyArray<string> {
  return args.map((arg) => redactCliText(arg));
}

function hasUnsafeBashCharacters(script: string): boolean {
  return (
    script.includes("\n") || script.includes("\0") || BASH_CONTROL_OPERATOR_PATTERN.test(script)
  );
}

function resolveInvocation(input: CliAdapterExecuteInput): {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
} {
  const adapter = adapterFor(input.tool);
  if (input.tool !== "bash") {
    if (input.script !== undefined) {
      throw new CliAdapterProviderError({
        operation: "resolveInvocation",
        detail: "Only the bash adapter accepts script input.",
      });
    }
    return { command: adapter.command, args: input.args ?? [] };
  }

  if (input.script === undefined || input.script.trim().length === 0) {
    throw new CliAdapterProviderError({
      operation: "resolveInvocation",
      detail: "The bash adapter requires a non-empty script.",
    });
  }
  if (input.args !== undefined && input.args.length > 0) {
    throw new CliAdapterProviderError({
      operation: "resolveInvocation",
      detail: "The bash adapter does not accept raw argument arrays.",
    });
  }
  if (hasUnsafeBashCharacters(input.script)) {
    throw new CliAdapterProviderError({
      operation: "resolveInvocation",
      detail: "The bash adapter only accepts single-line scripts.",
    });
  }

  const allowedPrefixes = input.allowedBashPrefixes ?? [];
  const allowed = allowedPrefixes.some((prefix) => input.script?.startsWith(prefix));
  if (!allowed) {
    throw new CliAdapterProviderError({
      operation: "resolveInvocation",
      detail: "The bash adapter requires an explicitly allowed command prefix.",
    });
  }

  return { command: adapter.command, args: ["-lc", input.script] };
}

function startedAuditBase(
  input: CliAdapterExecuteInput,
  command: string,
  args: ReadonlyArray<string>,
  mutates: boolean,
) {
  const startedAt = new Date();
  return {
    id: `cli-${input.tool}-${startedAt.getTime()}`,
    tool: input.tool,
    command,
    args: [...redactArgs(args)],
    cwd: input.cwd,
    mutates,
    confirmed: input.confirmed,
    startedAt,
  };
}

function completeAudit(
  base: ReturnType<typeof startedAuditBase>,
  status: KanbanConsoleCliAuditRecord["status"],
  output?: VcsProcess.VcsProcessOutput,
): KanbanConsoleCliAuditRecord {
  const completedAt = new Date();
  return {
    id: base.id,
    tool: base.tool,
    command: base.command,
    args: base.args,
    cwd: base.cwd,
    status,
    mutates: base.mutates,
    confirmed: base.confirmed,
    startedAt: base.startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: Math.max(0, completedAt.getTime() - base.startedAt.getTime()),
    ...(output === undefined ? {} : { exitCode: Number(output.exitCode) }),
    stdoutTruncated: output?.stdoutTruncated ?? false,
    stderrTruncated: output?.stderrTruncated ?? false,
  };
}

function isTimeoutError(error: VcsError): boolean {
  return error._tag === "VcsProcessTimeoutError";
}

function requiresConfirmation(adapter: KanbanConsoleCliAdapter): boolean {
  return adapter.mutationPolicy === "requires-confirmation";
}

export const make = Effect.fn("makeCliAdapterProvider")(function* () {
  const process = yield* VcsProcess.VcsProcess;
  const auditLog: KanbanConsoleCliAuditRecord[] = [];

  const execute = Effect.fn("CliAdapterProvider.execute")(function* (
    input: CliAdapterExecuteInput,
  ) {
    const adapter = adapterFor(input.tool);
    const invocation = yield* Effect.try<
      ReturnType<typeof resolveInvocation>,
      CliAdapterProviderError
    >({
      try: () => resolveInvocation(input),
      catch: (error) =>
        Schema.is(CliAdapterProviderError)(error)
          ? error
          : new CliAdapterProviderError({
              operation: "resolveInvocation",
              detail: "Failed to resolve CLI adapter invocation.",
              cause: error,
            }),
    });
    const mutates = input.mutates || requiresConfirmation(adapter);
    const auditBase = startedAuditBase(input, invocation.command, invocation.args, mutates);

    if (mutates && !input.confirmed) {
      const audit = completeAudit(auditBase, "blocked");
      auditLog.push(audit);
      return yield* new CliAdapterProviderError({
        operation: "execute",
        detail: "CLI adapter calls that may mutate state require explicit confirmation.",
      });
    }

    const processInput: VcsProcess.VcsProcessInput = {
      operation: `CliAdapterProvider.${input.tool}`,
      command: invocation.command,
      args: invocation.args,
      cwd: input.cwd,
      allowNonZeroExit: true,
      timeoutMs: input.timeoutMs ?? adapter.timeoutMs,
      maxOutputBytes: input.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES,
      truncateOutputAtMaxBytes: true,
      ...(input.env === undefined ? {} : { env: input.env }),
    };
    const output = yield* process.run(processInput).pipe(
      Effect.catch((cause) => {
        const audit = completeAudit(auditBase, isTimeoutError(cause) ? "timed-out" : "failed");
        auditLog.push(audit);
        return Effect.fail(
          new CliAdapterProviderError({
            operation: "execute",
            detail: redactCliText(cause.message),
            cause,
          }),
        );
      }),
    );

    const status = Number(output.exitCode) === 0 ? "succeeded" : "failed";
    const audit = completeAudit(auditBase, status, output);
    auditLog.push(audit);

    return {
      tool: input.tool,
      exitCode: Number(output.exitCode),
      stdout: redactCliText(output.stdout),
      stderr: redactCliText(output.stderr),
      audit,
    } satisfies KanbanConsoleCliExecutionResult;
  });

  return CliAdapterProvider.of({
    listAdapters: () => [...ADAPTERS],
    execute,
    readAuditLog: () => [...auditLog],
  });
});

export const layer = Layer.effect(CliAdapterProvider, make());
