// @effect-diagnostics importFromBarrel:off
// Kanban provider tests use the existing Effect/Vitest service-layer harness style.
import { assert, afterEach, describe, expect, it, vi } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ChildProcessSpawner } from "effect/unstable/process";
import { VcsProcessSpawnError, VcsProcessTimeoutError } from "@t3tools/contracts";

import * as VcsProcess from "../vcs/VcsProcess.ts";
import * as CliAdapterProvider from "./CliAdapterProvider.ts";

const processOutput = (input: {
  readonly stdout?: string;
  readonly stderr?: string;
  readonly exitCode?: number;
  readonly stdoutTruncated?: boolean;
  readonly stderrTruncated?: boolean;
}): VcsProcess.VcsProcessOutput => ({
  exitCode: ChildProcessSpawner.ExitCode(input.exitCode ?? 0),
  stdout: input.stdout ?? "",
  stderr: input.stderr ?? "",
  stdoutTruncated: input.stdoutTruncated ?? false,
  stderrTruncated: input.stderrTruncated ?? false,
});

const mockRun = vi.fn<VcsProcess.VcsProcessShape["run"]>();

const layer = CliAdapterProvider.layer.pipe(
  Layer.provide(
    Layer.mock(VcsProcess.VcsProcess)({
      run: mockRun,
    }),
  ),
);

afterEach(() => {
  mockRun.mockReset();
});

describe("CliAdapterProvider", () => {
  it.effect("lists the known Phase 10 CLI adapters", () =>
    Effect.gen(function* () {
      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const adapters = provider.listAdapters();

      assert.deepStrictEqual(
        adapters.map((adapter) => adapter.id),
        ["gh", "git", "coderabbit", "doppler", "vercel", "render", "bun", "bash"],
      );
      expect(adapters.every((adapter) => adapter.mutationPolicy === "requires-confirmation")).toBe(
        true,
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect("executes a confirmed CLI call with timeout, redaction, and audit capture", () =>
    Effect.gen(function* () {
      mockRun.mockReturnValueOnce(
        Effect.succeed(
          processOutput({
            stdout: "token=ghp_123456789012345678901234567890123456",
            stderr: "DOPPLER_TOKEN=doppler_1234567890123456",
          }),
        ),
      );

      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const result = yield* provider.execute({
        tool: "gh",
        cwd: "/repo",
        args: ["pr", "checks", "20", "--repo", "MohAnghabo/kanban-console"],
        mutates: false,
        confirmed: true,
        timeoutMs: 12_345,
      });

      expect(result.stdout).toContain("[redacted]");
      expect(result.stderr).toBe("DOPPLER_TOKEN=[redacted]");
      expect(result.audit.status).toBe("succeeded");
      expect(provider.readAuditLog()).toHaveLength(1);
      expect(mockRun).toHaveBeenCalledWith({
        operation: "CliAdapterProvider.gh",
        command: "gh",
        args: ["pr", "checks", "20", "--repo", "MohAnghabo/kanban-console"],
        cwd: "/repo",
        env: undefined,
        allowNonZeroExit: true,
        timeoutMs: 12_345,
        maxOutputBytes: 500_000,
        truncateOutputAtMaxBytes: true,
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("blocks confirmation-required adapter calls before spawning a process", () =>
    Effect.gen(function* () {
      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const error = yield* provider
        .execute({
          tool: "git",
          cwd: "/repo",
          args: ["push"],
          mutates: true,
          confirmed: false,
        })
        .pipe(Effect.flip);

      expect(error._tag).toBe("CliAdapterProviderError");
      expect(mockRun).not.toHaveBeenCalled();
      expect(provider.readAuditLog()).toMatchObject([{ tool: "git", status: "blocked" }]);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("does not let callers bypass confirmation by marking unsafe commands read-only", () =>
    Effect.gen(function* () {
      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const error = yield* provider
        .execute({
          tool: "gh",
          cwd: "/repo",
          args: ["pr", "merge", "20", "--squash"],
          mutates: false,
          confirmed: false,
        })
        .pipe(Effect.flip);

      expect(error._tag).toBe("CliAdapterProviderError");
      expect(mockRun).not.toHaveBeenCalled();
      expect(provider.readAuditLog()).toMatchObject([
        { tool: "gh", status: "blocked", mutates: true },
      ]);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("allows mutating adapter calls after explicit confirmation", () =>
    Effect.gen(function* () {
      mockRun.mockReturnValueOnce(Effect.succeed(processOutput({ stdout: "ok" })));

      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const result = yield* provider.execute({
        tool: "git",
        cwd: "/repo",
        args: ["push"],
        mutates: true,
        confirmed: true,
      });

      expect(result.audit).toMatchObject({
        tool: "git",
        status: "succeeded",
        mutates: true,
        confirmed: true,
      });
    }).pipe(Effect.provide(layer)),
  );

  it.effect("constrains bash to explicitly allowed single-line script prefixes", () =>
    Effect.gen(function* () {
      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const rejected = yield* provider
        .execute({
          tool: "bash",
          cwd: "/repo",
          script: "rm -rf .tmp",
          allowedBashPrefixes: ["bash scripts/"],
          mutates: true,
          confirmed: true,
        })
        .pipe(Effect.flip);
      expect(rejected._tag).toBe("CliAdapterProviderError");

      const chained = yield* provider
        .execute({
          tool: "bash",
          cwd: "/repo",
          script: "bash scripts/check-pr-readiness.sh; git push",
          allowedBashPrefixes: ["bash scripts/"],
          mutates: true,
          confirmed: true,
        })
        .pipe(Effect.flip);
      expect(chained._tag).toBe("CliAdapterProviderError");

      const traversal = yield* provider
        .execute({
          tool: "bash",
          cwd: "/repo",
          script: "bash scripts/../deploy.sh",
          allowedBashPrefixes: ["bash scripts/"],
          mutates: true,
          confirmed: true,
        })
        .pipe(Effect.flip);
      expect(traversal._tag).toBe("CliAdapterProviderError");

      mockRun.mockReturnValueOnce(Effect.succeed(processOutput({ stdout: "OK" })));
      const accepted = yield* provider.execute({
        tool: "bash",
        cwd: "/repo",
        script: "bash scripts/check-pr-readiness.sh",
        allowedBashPrefixes: ["bash scripts/"],
        mutates: false,
        confirmed: true,
      });

      expect(accepted.audit.status).toBe("succeeded");
      expect(mockRun).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "bash",
          args: ["-lc", "bash scripts/check-pr-readiness.sh"],
        }),
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect("records failed non-zero exits and redacts secret-like arguments", () =>
    Effect.gen(function* () {
      mockRun.mockReturnValueOnce(
        Effect.succeed(
          processOutput({
            exitCode: 2,
            stderr: "failed with OPENAI_API_KEY=sk-123456789012345678901234567890",
          }),
        ),
      );

      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const result = yield* provider.execute({
        tool: "bun",
        cwd: "/repo",
        args: ["run", "deploy", "--token=ghp_123456789012345678901234567890123456"],
        mutates: false,
        confirmed: true,
      });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toBe("failed with OPENAI_API_KEY=[redacted]");
      expect(result.audit.status).toBe("failed");
      expect(result.audit.args).toContain("--token=[redacted]");
    }).pipe(Effect.provide(layer)),
  );

  it.effect("records missing CLI failures without exposing raw process errors as success", () =>
    Effect.gen(function* () {
      mockRun.mockReturnValueOnce(
        Effect.fail(
          new VcsProcessSpawnError({
            operation: "test",
            command: "coderabbit",
            cwd: "/repo",
            cause: new Error("ENOENT"),
          }),
        ),
      );

      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const error = yield* provider
        .execute({
          tool: "coderabbit",
          cwd: "/repo",
          args: ["review"],
          mutates: false,
          confirmed: true,
        })
        .pipe(Effect.flip);

      expect(error._tag).toBe("CliAdapterProviderError");
      expect(provider.readAuditLog()).toMatchObject([{ tool: "coderabbit", status: "failed" }]);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("records timeout failures as timed-out audit records", () =>
    Effect.gen(function* () {
      mockRun.mockReturnValueOnce(
        Effect.fail(
          new VcsProcessTimeoutError({
            operation: "test",
            command: "vercel deploy",
            cwd: "/repo",
            timeoutMs: 10,
          }),
        ),
      );

      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const error = yield* provider
        .execute({
          tool: "vercel",
          cwd: "/repo",
          args: ["deploy"],
          mutates: true,
          confirmed: true,
          timeoutMs: 10,
        })
        .pipe(Effect.flip);

      expect(error._tag).toBe("CliAdapterProviderError");
      expect(provider.readAuditLog()).toMatchObject([{ tool: "vercel", status: "timed-out" }]);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("redacts secret-like arguments from failed process error details", () =>
    Effect.gen(function* () {
      mockRun.mockReturnValueOnce(
        Effect.fail(
          new VcsProcessTimeoutError({
            operation: "test",
            command: "gh api --token=ghp_123456789012345678901234567890123456",
            cwd: "/repo",
            timeoutMs: 10,
          }),
        ),
      );

      const provider = yield* CliAdapterProvider.CliAdapterProvider;
      const error = yield* provider
        .execute({
          tool: "gh",
          cwd: "/repo",
          args: ["api", "--token=ghp_123456789012345678901234567890123456"],
          mutates: false,
          confirmed: true,
          timeoutMs: 10,
        })
        .pipe(Effect.flip);

      expect(error.detail).toContain("--token=[redacted]");
      expect(error.detail).not.toContain("ghp_123456789012345678901234567890123456");
      expect(provider.readAuditLog()[0]?.args).toContain("--token=[redacted]");
    }).pipe(Effect.provide(layer)),
  );
});
