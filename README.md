# Hack2025 News Aggregator

A Next.js 14 monorepo that gathers news from a configurable list of RSS feeds, deduplicates stories, adds short summaries, and surfaces warnings for failing sources. The project is structured for collaborative development between local IDE work and cloud agents.

## Features
- **Multi-source feed ingestion** with normalization and deduplication logic shared across services.
- **Keyword filtering** and automatic refresh interval in the web UI.
- **Summary generation** via OpenAI with an in-memory cache and deterministic fallback summariser.
- **Warning panel** that reports feeds that failed during the last refresh and highlights the total count.
- **CI/CD pipeline** covering lint, test, build, guard workflows, and a Vercel deployment pipeline.
- **Automated patch ingestion** script to convert `patch.diff` drops into PRs with optional auto-merge.

## Repository layout
```
apps/web              # Next.js application (App Router) and API routes
packages/shared       # Reusable utilities, types, summariser, and unit tests
services/api          # Feed ingestion helpers consumed by the Next API route
scripts/ide_patch_ingest.ps1   # Task-scheduler friendly patch ingestion helper
.github/workflows     # CI (lint/test/build), guard, and deploy pipelines
docs/                 # Integration notes and auxiliary documentation
```

## Getting started
1. **Install prerequisites**
   - Node.js 20+
   - pnpm 10.18.0+
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env.local` at the repository root or within `apps/web` depending on your preferred layout.
   - Provide at minimum:
     - `OPENAI_API_KEY` (optional; summaries fall back to extractive mode without it)
     - `OPENAI_MODEL` (optional, defaults to `gpt-4o-mini`)
     - `SUMMARY_CACHE_TTL_MS` to tune cache expiry (defaults to 30 minutes).
4. **Run the development server**
   ```bash
   pnpm dev
   ```
   This launches the web app on `http://localhost:3000`.

## Testing and quality checks
- Run all tests: `pnpm test`
- Watch tests during development: `pnpm test:watch`
- Lint the Next.js app: `pnpm lint:web`
- Workspace-wide lint (includes scripts and config files): `pnpm lint:workspace`

CI mirrors these commands in `.github/workflows/ci.yml`, ensuring parity between local and remote checks.

## Deployment
The repository ships with `.github/workflows/deploy.yml`, which promotes the `apps/web` build to Vercel whenever `main` changes. To activate it:
1. Create a Vercel project pointing to the `apps/web` directory.
2. Add the following GitHub secrets in the repository settings:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. (Optional) Populate project-level environment variables (e.g. `OPENAI_API_KEY`) through Vercel or GitHub encrypted secrets.

Once configured, pushes to `main` and manual `workflow_dispatch` events will deploy automatically. The job pre-builds the app (`pnpm --filter web build`) before invoking `vercel/action@v3` for the production deploy.

## Automated IDE patch ingestion
`scripts/ide_patch_ingest.ps1` converts periodic `patch.diff` drops into pull requests:
1. Schedule the script with Windows Task Scheduler (recommended cadence: every 5 minutes).
2. Ensure Git credentials and GitHub CLI (`gh`) are available on the host.
3. Place a `patch.diff` file at the configured `PatchPath`; the script will:
   - Create a topic branch off `dev`.
   - Apply the patch (falling back to `--reject` on conflicts).
   - Push the branch and create an auto-merge PR if GitHub CLI is present.

## Branch policy & CI guardrails
- `dev` and `main` are protected via required checks (install, lint, test, build) and conversation resolution.
- `.github/workflows/guard-direct-push.yml` softly warns on direct pushes to protected branches.
- `ci.yml` validates install, unit tests, app linting, and Next build for every pull request.

## Useful scripts
- `pnpm --filter web lint` – Next.js lint with the app's configuration.
- `pnpm --filter web build` – Production build for verification or Vercel prebuilds.
- `pnpm --filter @hack2025/shared test` – Run only shared utility tests.

For additional context on architectural decisions and follow-up ideas, see `docs/INTEGRATION_NOTES.md`.