---
description: Prepare and check deployment readiness with explicit approval gates.
argument-hint: "<target> [environment] [--prepare-only]"
---

Prepare deployment readiness for: $ARGUMENTS

This command is check/prepare-only by default. It must not deploy, create a
GitHub release, push a Docker image, tag, merge, or mutate provider state unless
the user explicitly approves the exact action. Production deploy, release, and
tag actions require a second confirmation.

## Supported Targets

- `web`
- `github-release`
- `docker`
- `vercel`
- `render`
- `all`

## Supported Environments

- `local`
- `staging`
- `production`

## Required Reading

1. `AGENTS.md`
2. `docs/project.md`
3. `review.md`
4. `.ai/rules/00-constitution.md`
5. `.ai/rules/13-security.md`
6. `.ai/rules/14-secret-management.md`
7. `.ai/rules/16-deployment.md`
8. `.ai/rules/17-aws-well-architected.md`
9. `.ai/rules/18-pr-readiness.md`
10. `.ai/rules/20-environments.md`
11. `.ai/rules/22-kanban-console.md`

## Step A - Resolve Deployment Intent

Parse `$ARGUMENTS` into:

- target: one of the supported targets, or `all`
- environment: `local`, `staging`, or `production`
- mode: `prepare-only` unless the user explicitly requests a later approved
  mutation

Ask concise questions and stop if any required detail is missing:

- Which target should be checked: web, GitHub release, Docker, Vercel, Render,
  or all?
- Which environment: local, staging, or production?
- What Vercel project/team should be checked?
- What Render service(s) should be checked?
- What Docker registry/image name should be checked?
- What GitHub release name and tag should be prepared?
- What branch or commit is intended for deployment?
- What rollback commit or git revert plan should be used?

Do not guess provider identifiers.

## Step B - Safety Gates

Before any deploy-ready result, verify:

- Current branch and git state.
- Target environment is consistent with branch policy.
- `docs/project.md` environment topology matches the requested environment.
- No uncommitted unrelated changes are present.
- No real secret values are printed or copied into output.
- Rollback path is documented as git revert.
- Production deploys, releases, and tags are marked as second-confirmation
  actions.

If this command touches environment topology, run:

```bash
bun preflight --only='env/*'
```

For broader deploy readiness, run:

```bash
bun preflight
```

For security-sensitive deployment changes, run:

```bash
bash scripts/security-audit.sh
```

If any command would reveal secret values, summarize presence/absence only and
do not print raw provider output.

## Step C - Secret And Provider Checks

Check only for readiness, never values:

- GitHub Actions secrets exist for required deployment keys.
- Doppler project/config exists and remains the intended secret source of truth.
- Vercel environment variables are present for the target environment.
- Render environment variables or env groups are present for the target
  services.
- Local `.env` files are ignored by git and used only for local checks.

Allowed wording:

- `VERCEL_TOKEN: present`
- `RENDER_API_KEY: missing`
- `DOPPLER_TOKEN_PRODUCTION: not checked because gh secret access failed`

Forbidden wording:

- Any raw token, credential, API key, secret value, `.env` value, or command log
  containing one.

## Step D - Target-Specific Checks

### Web

- Confirm build command.
- Confirm preview/staging/production URL.
- Confirm API/backend URL for the environment.
- Run the relevant validation command before marking ready.

### GitHub Release

- Confirm tag name and release title.
- Confirm target commit.
- Confirm changelog/release notes source.
- Confirm release notes are redacted.
- Stop before creating tags or releases.

### Docker

- Confirm registry and image name.
- Confirm Dockerfile/build context.
- Confirm tag strategy.
- Confirm image push permissions.
- Stop before build push unless explicitly approved.

### Vercel

- Confirm project and team.
- Confirm target environment mapping.
- Confirm required environment variables are present.
- Stop before deploy unless explicitly approved.

### Render

- Confirm service names.
- Confirm deploy hook/API readiness.
- Confirm environment group mapping.
- Stop before deploy unless explicitly approved.

## Step E - Approval Protocol

When a mutation is requested, show:

- Exact command or provider action.
- Target environment.
- Target branch/commit/tag.
- Expected effect.
- Rollback command or git revert plan.
- Whether this is production.

Ask for approval before proceeding. If production, ask for second confirmation
after the first approval.

Do not proceed on ambiguous approval.

## Step F - Output

Return a concise readiness report:

- Target and environment.
- Git state.
- Required checks run and result.
- Provider readiness.
- Secret readiness by presence only.
- Release/tag readiness.
- Stop gates reached.
- Rollback plan.
- Open gaps.
- Exact next command or approval needed.

## Rules

- No deployment writes by default.
- No GitHub release/tag writes by default.
- No Docker push by default.
- No Vercel/Render deploy by default.
- No secret values in output, logs, comments, PR text, or generated artifacts.
- Write non-permanent deploy notes to `.local/` unless the user explicitly asks
  to promote them into tracked docs.
