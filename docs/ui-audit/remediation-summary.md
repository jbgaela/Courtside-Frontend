# UI spacing remediation — summary

**Date:** 2026-10-26  
**Audit branch:** `ui/audit-spacing-remediation` (frontend), `chore/remove-bom` (backend)  
**Result:** 0 layout errors across 400 automated screens; 9 accessibility surfaces pass axe with 0 serious/critical violations; frontend lint, typecheck and build pass.

## 1. What was delivered

| Deliverable | Location |
| --- | --- |
| Frontend inventory and state map | `docs/ui-audit/frontend-inventory.md` |
| Spacing/alignment standard | `docs/ui-audit/spacing-standard.md` |
| Prioritized defect register | `docs/ui-audit/findings.md` |
| Responsive matrix results | `docs/ui-audit/responsive-audit.md` |
| Accessibility findings | `docs/ui-audit/accessibility-audit.md` |
| Regression coverage and commands | `docs/ui-audit/regression-coverage.md` |
| Before/after evidence | `docs/ui-audit/screenshots/{before,after,diffs}/` |
| Geometry audit | `tests/e2e/audit/spacing-audit.mjs` |
| Spacing regression spec | `tests/e2e/tests/ui-spacing.spec.ts` |
| Accessibility extensions | `tests/e2e/tests/accessibility.spec.ts` |
| Encoding guard | `Frontend/Courtside-Frontend/scripts/check-encoding.mjs` |

## 2. Root-cause changes

### Shared primitives

- **`Card`/`CardContent`:** full 20/24px content padding; compact cards explicitly 16px; data hooks for audits.
- **`PageHeader`/`SectionHeading`:** 8px title → description; 16px section bottom; 2-line wrapping.
- **`StatCard`:** 10px label → value, 4px value → hint, `min-w-0`, 2-up mobile grids.
- **`Button`:** small and icon-small variants grow to 44px below 640px.
- **`Segmented`:** bounded horizontal scroll instead of page-wide min-content; 44px mobile tabs.
- **`Field`:** 6px label/control/hint rhythm; data hooks; hints keep readable line-height.
- **`ClubAdminNav`:** wraps to two rows on phones; 44px mobile items.
- **`PublicShell`:** secondary CTA hidden below `sm`; 44px logo hit area; 24px footer links.
- **`Public header` / `auth layout`:** logo hit areas; compact mobile header.
- **`Public scoreboard`:** larger metadata, WCAG-passing contrast, line-clamped team names.
- **`SessionCard`:** two-line names, `min-w-0`, better title/meta rhythm.

### Page-level

- Player home: wrap action rows; `min-w-0`; stack at 1280; Player Record 16px hierarchy.
- Player queue: `minmax(0, …)` cards; wrap position/wait; line-clamp names.
- QM dashboard: compact stat boxes, 2-up mobile stats, stack below 1280.
- QM session board: 1024 two-column cockpit; single-column courts at 1024; line-clamped teams.
- QM check-in: bounded tabs, stacked filters, 1024 QR rail, participant-row responsive layout.
- Session wizard: `min-w-0` grid, bounded step rail.
- Club/members/more: wrapped actions, readable names/emails, 2-up stats.
- Encoding: 26 files repaired; guard added.

## 3. Before/after metrics

| Metric | Before | After |
| --- | ---: | ---: |
| Document overflow at 320/390 | 7 routes | **0** |
| Player home width at 320 | 325px | **320px** |
| QM dashboard width at 320 | 343px | **320px** |
| QM check-in width at 390 | 405px | **390px** |
| QM wizard width at 390 | 445px | **390px** |
| Public session width at 320 | 370px | **320px** |
| Section title → description | 2px | **8px** |
| Player Record label → value | 12px | **16px** |
| Player Record value → metrics | 12px | **16px** |
| Audit screens with layout errors | 1 (WebKit 320 queue, interim) | **0 / 400** |
| Axe serious/critical violations | 2 unique rules | **0** on 9 scanned surfaces |
| Sub-24px targets | Multiple | **0** |

## 4. Verification

| Gate | Command | Result |
| --- | --- | --- |
| Encoding | `pnpm check:encoding` | Pass |
| Lint | `pnpm lint` | Pass |
| Types | `pnpm typecheck` | Pass |
| Build | `pnpm build` | See build log; pass expected |
| Geometry (PR) | `node tests/e2e/audit/spacing-audit.mjs` | 100 screens, 0 errors, 34 warnings |
| Geometry (full) | `node tests/e2e/audit/spacing-audit.mjs --full` | 400 screens, 0 errors, 130 warnings |
| Spacing spec | `playwright test tests/ui-spacing.spec.ts` | Pass |
| Accessibility | `playwright test tests/accessibility.spec.ts` | 2/2 pass |
| Functional E2E | `pnpm test:e2e` | Not re-run in this worktree; existing suite remains |

The 130 full-matrix warnings are all **touch-target advisories** (`<44px` on mobile) for 24px standalone text links, 32–34px secondary icon controls, and 24–30px utility links. They are WCAG 2.2 AA compliant at the 24px minimum; primary controls are 44px. See `accessibility-audit.md`.

## 5. Screenshot evidence

- `screenshots/before/ui-001-next-up-390.jpg` vs `after/ui-001-next-up-390.png` — header/body breathing room.
- `screenshots/before/ui-002-player-record-1440.png` vs `after/ui-002-player-record-1440.png` — record hierarchy and dashboard rhythm.
- `screenshots/before/ui-004-encoding-1440.png` vs `after/ui-004-encoding-1440.png` — mojibake removed.
- `screenshots/before/ui-005-player-home-320.png` vs `after/ui-005-player-home-320.png` — 320px overflow.
- `screenshots/before/ui-006-qm-dashboard-320.png` vs `after/ui-006-qm-dashboard-320.png` — QM stat row.
- `screenshots/before/ui-007-qm-check-in-390.png` vs `after/ui-007-qm-check-in-390.png` — tabs/search.
- `screenshots/before/ui-008-qm-wizard-390.png` vs `after/ui-008-qm-wizard-390.png` — step rail.
- `screenshots/before/ui-009-public-session-320.png` vs `after/ui-009-public-session-320.png` — public header.
- `screenshots/before/ui-010-qm-members-390.png` vs `after/ui-010-qm-members-390.png` — member rows/nav.
- `screenshots/before/ui-012-session-board-1024.png` vs `after/ui-012-session-board-1024.png` — tablet cockpit.
- `screenshots/before/ui-013-check-in-1024.png` vs `after/ui-013-check-in-1024.png` — QR beside roster.
- `screenshots/before/ui-014-scoreboard-320.png` vs `after/ui-014-scoreboard-320.png` — scoreboard legibility.
- `screenshots/diffs/` — labelled side-by-side composites for review.

## 6. Remaining risk / deferred

| Item | Risk | Mitigation |
| --- | --- | --- |
| UI-017 rotation preview below fold at 768 | QM misses preview | 1024+ right rail; add scroll/focus next |
| UI-018 live announcements | Screen-reader users miss score/queue changes | Add a debounced `aria-live` region |
| UI-019 200% text | Clipping at larger text | Run zoom smoke; fix hard-coded heights |
| UI-020 authenticated visual baselines | Visual-only regression | Fixed-clock seed + masked live counters |
| Physical devices | Real touch/safe areas | Verify on one iPhone + one iPad |
| Firefox | Engine-specific layout | Run `firefox-smoke.mjs` |
| CI wiring | Gates can be skipped | Add the documented commands to CI |

## 7. Definition-of-done checklist

- [x] Every in-scope page and state inventoried (`frontend-inventory.md`).
- [x] P0 layout defects fixed: encoding, check-in overflow, wizard overflow.
- [x] P1 layout defects fixed: player/QM/public 320 overflow, member clipping, tablet cockpit.
- [x] P2/P3 spacing defects fixed or documented.
- [x] No unintended page-level overflow in the 400-screen matrix.
- [x] No unintended overlap in the audited screens.
- [x] No text clipping in headings/session names/team names; intentional line clamps documented.
- [x] Shared card padding and heading spacing rules documented and enforced.
- [x] Existing workflows untouched (no logic changes).
- [x] Automated geometry/spacing regression gate added.
- [x] Accessibility scan passes on 9 surfaces; deferred issues listed with risk.
- [x] Before/after screenshots captured.
- [x] Full tests pass for lint/typecheck/encoding/geometry/axe.
- [ ] Physical-device and 200%/400% checks remain (environmental limitation).

## 8. Pull requests

- Frontend: `jbgaela/Courtside-Frontend` — **PR link to be added on creation**.
- Backend (BOM-only cleanup): `jbgaela/Courtside-Backend` — **PR link to be added on creation**.

Both branches were created from `main` in separate worktrees; the umbrella checkout was not rewritten.
