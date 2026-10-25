# Regression coverage and reproduction

**Date:** 2026-10-26  
**Rule:** Pull requests run a focused, fast gate; the full responsive/visual matrix runs before release. Visual baselines are reviewed, never blindly overwritten.

## 1. Coverage map

| Layer | Tool | Scope | When |
| --- | --- | --- | --- |
| Encoding | `scripts/check-encoding.mjs` | `src`, `public`, `scripts`, README, package.json; fails on BOM/U+FFFD/mojibake | `pnpm lint`, `pnpm build` |
| Lint | ESLint 9 + Next config | Frontend source | PR |
| Types | `tsc --noEmit` + Next typegen | Frontend source | PR |
| Component/contracts | Vitest | Contracts package | PR |
| Geometry gate | `tests/e2e/tests/ui-spacing.spec.ts` | 4 player routes at 320/390/768/1440; check-in at 320/390; wizard; dashboard stat alignment; card insets | PR |
| Geometry audit | `tests/e2e/audit/spacing-audit.mjs` | 20 routes × 5 widths × Chromium = 100 screens in PR mode; `--full` = 2 engines × 10 widths = 400 screens | PR / release |
| Accessibility | `tests/e2e/tests/accessibility.spec.ts` | Welcome, player queue/home/history, public session, QM dashboard/check-in/wizard, public scoreboard; serious/critical axe | PR / release |
| Functional E2E | Existing Playwright suite | Auth, queue, QM board, scoring, public PWA, admin | PR / release |
| Visual baselines | `playwright.visual.config.ts` | Sign-in 320/390/744/1180, offline 390 | Release (static pages) |
| Screenshot audit | `tests/e2e/audit/capture.mjs` | 172 states; 301 screenshots; axe/perf/keyboard/zoom samples | Release/manual |

## 2. What the spacing audit asserts

### Errors (fail the run)

1. **Document overflow** — `scrollWidth > viewport + 1` at any audited route/width.
2. **Clipped text** — an element with `overflow: hidden/clip`, text, and no `title`/`aria-label`/line-clamp/scroll container.
3. **Unintended overlap** — intersecting interactive/text atoms, excluding nested elements, decorative fixed/sticky chrome, and geometry clipped by scroll containers.
4. **Heading rhythm** — page/section title → description outside 4–16px.
5. **Field rhythm** — label → control outside 2–12px.
6. **Stat rhythm** — stat label → value outside 4–16px.
7. **Sub-24px targets** — buttons/links/inputs below WCAG 2.2 AA target size.

### Warnings (reported, non-blocking)

1. **Card padding** outside 12–32px.
2. **Targets below 44px on mobile** (advisory for touch comfort; inline links are excepted by WCAG).
3. **Missing semantic hooks** — implicit, because the audit can only measure components that expose `data-ui` landmarks.

### Reporting

Each result stores engine, width, route, path, duration, document width, and every violation with a measured value. Outputs:

- `tests/e2e/audit/spacing-results/report.json`
- `tests/e2e/audit/spacing-results/summary.md`
- console summary with the first six violations per screen

Results identify the rule and the measured geometry, not just “failed”.

## 3. Reproduce the audit

### One-time setup (umbrella checkout)

```bash
pnpm install:all
pnpm db:up
pnpm db:push
pnpm db:seed
pnpm dev:api   # terminal 1, http://localhost:4000
pnpm dev:web   # terminal 2, http://localhost:3000
```

### PR gate

```bash
pnpm audit:spacing
pnpm --dir tests/e2e exec playwright test tests/ui-spacing.spec.ts --project=desktop-chromium
pnpm --dir tests/e2e exec playwright test tests/accessibility.spec.ts --project=desktop-chromium
```

PowerShell:

```powershell
$env:BASE_URL='http://localhost:3000'; $env:API_URL='http://localhost:4000'
node tests\e2e\audit\spacing-audit.mjs
```

### Release gate

```bash
pnpm audit:spacing:full
pnpm test:e2e
pnpm --dir tests/e2e exec playwright test -c playwright.visual.config.ts
node tests/e2e/audit/firefox-smoke.mjs
node tests/e2e/audit/zoom-smoke.mjs
```

### Isolated instance (used for this audit)

```powershell
# backend (separate database on the shared MongoDB replica set)
$env:DATABASE_URL='mongodb://localhost:27017/picklequeue_ui_audit?replicaSet=rs0&directConnection=true'
$env:SEED_PASSWORD='PickleQueue123!'
pnpm --dir Backend/Courtside-Backend exec prisma db push --skip-generate
pnpm --dir Backend/Courtside-Backend exec tsx prisma/seed.ts

# API :4100
$env:PORT='4100'; $env:RATE_LIMIT_DISABLED='true'; $env:FRONTEND_ORIGIN='http://localhost:3100'
pnpm --dir Backend/Courtside-Backend exec tsx src/server.ts

# Web :3100 (worktree or merged main)
$env:NEXT_PUBLIC_API_URL='http://localhost:4100'
$env:API_INTERNAL_URL='http://localhost:4100'
$env:NEXT_PUBLIC_APP_URL='http://localhost:3100'
pnpm --dir Frontend/Courtside-Frontend exec next dev -p 3100

# Audit
$env:BASE_URL='http://localhost:3100'; $env:API_URL='http://localhost:4100'
node tests\e2e\audit\spacing-audit.mjs --full
```

The audit logs in once per role through the API, reuses storage state, and blocks service workers for deterministic renders. On a normal API the login rate limit is sufficient for one run; the disposable/test API sets `RATE_LIMIT_DISABLED=true`.

## 4. Baseline management

- **Static visual baselines:** sign-in at 320/390/744/1180 and offline at 390. Reviewed baselines live under `tests/e2e/audit/visual/baseline.spec.ts-snapshots/`.
- **Authenticated visual baselines:** deferred. The demo seed contains live clocks, elapsed waits, and scores; full-page screenshots are nondeterministic. The geometry gate covers these pages in the meantime. Add a fixed-clock seed mode before introducing them.
- **Updating a baseline:** run the visual project, inspect the diff in the Playwright report, confirm the change is intentional, then commit the new image with the code change that caused it. Never run `--update-snapshots` to make a red build green without review.
- **Artifacts:** Playwright keeps traces/videos on failure; the audit keeps `report.json`, `summary.md`, and screenshots. CI should retain these for one release cycle.

## 5. Test data isolation

- The release gate uses `tests/e2e/scripts/run-e2e.mjs`: disposable MongoDB container, `prisma db push`, deterministic seed, ephemeral API/web ports, cleanup in `finally`.
- This audit used a separate `picklequeue_ui_audit` database and ports 4100/3100 so it could not mutate the user’s running demo API.
- The screenshot evidence script creates/updates only audit-specific users and never deletes seeded players.
- No test writes to production; the audit commands refuse to run against an API that is not reachable.

## 6. Known coverage gaps

| Gap | Risk | Next action |
| --- | --- | --- |
| No CI workflow in the frontend repo | Gates are manual | Wire `pnpm audit:spacing`, `ui-spacing.spec.ts`, and the axe spec into the team’s CI |
| Authenticated screenshots deferred | Visual-only regressions | Fixed-clock seed + masked live regions |
| 200%/400% zoom not in the matrix | A11Y-05 remains | Run `zoom-smoke.mjs` and add 200% screenshots |
| Firefox not in this spacing run | Engine-specific layout | Run `firefox-smoke.mjs`; add Firefox to `--full` if time allows |
| Physical devices not attached | Touch/safe-area risk | Verify on iPhone 13 mini, iPhone 15 Pro, iPad mini, standard iPad |
| Overlap detector is heuristic | False negatives at complex overlaps | Pair with screenshot review; keep exceptions documented |

## 7. Failure-artifact checklist

1. Read the rule and measured value in `summary.md`.
2. Open the matching screen at that engine/width in a real browser.
3. Compare against the documented rule in `spacing-standard.md`.
4. Fix the shared component before the page-specific instance.
5. Re-run the PR gate, then the full matrix.
6. Capture before/after evidence; add the issue to `findings.md`.
7. If the baseline must change, review the diff and record why in the PR.
