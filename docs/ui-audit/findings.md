# PickleQueue UI/UX findings register

**Audit date:** 2026-10-26  
**Baseline evidence:** `tests/e2e/audit/results/` (2026-10-25), `.openchamber/screenshots/`, and the spacing probe output captured before remediation.  
**After evidence:** `docs/ui-audit/screenshots/after/`, `audit/spacing-results/report.json`.  
**Production code touched:** frontend only (plus a BOM-only backend cleanup PR). No matchmaking, scoring, queue-rotation, auth, or persistence logic was changed.

## Status summary

| ID | Priority | Finding | Status |
| --- | --- | --- | --- |
| UI-001 | P2 | “Next up” header title crowded against the header/body boundary | Fixed / Verified |
| UI-002 | P2 | Player Record lacked separation between heading, value, and metrics | Fixed / Verified |
| UI-003 | P2 | Dashboard spacing and gutters inconsistent; section descriptions almost touched headings | Fixed / Verified |
| UI-004 | P0 | Mojibake and BOM characters in user-visible copy | Fixed / Verified |
| UI-005 | P1 | Player home overflowed at 320px | Fixed / Verified |
| UI-006 | P1 | QM dashboard overflowed at 320px | Fixed / Verified |
| UI-007 | P0 | QM check-in overflowed at 320/390px | Fixed / Verified |
| UI-008 | P0 | Session wizard overflowed at every phone width below 445px | Fixed / Verified |
| UI-009 | P1 | Public header and player header clipped at 320px | Fixed / Verified |
| UI-010 | P1 | Member names/emails clipped in narrow cards | Fixed / Verified |
| UI-011 | P2 | “More” account name clipped by the role badge | Fixed / Verified |
| UI-012 | P2 | Team names clipped in live board court cards | Fixed / Verified |
| UI-013 | P1 | Sub-44px mobile controls and 24px standalone links | Fixed (primary controls) / Advisories documented |
| UI-014 | P2 | Public scoreboard metadata too small/low contrast; names clipped | Fixed / Verified |
| UI-015 | P1 | QR panel and tablet cockpit below the fold at 1024px | Fixed (1024 cockpit) / Verified |
| UI-016 | P3 | Compact card rhythm and touch-target drift across repeated lists | Fixed / Verified |
| UI-017 | P1 | Rotation preview can appear below the fold after Generate | Deferred |
| UI-018 | P0 | No live region for score/queue updates | Deferred (accessibility) |
| UI-019 | P1 | 200% text scaling breaks some QM/player layouts | Deferred |
| UI-020 | P2 | Authenticated visual baselines for dynamic pages | Deferred |

---

## UI-001 — Next up header/body boundary

- **Route/Page:** `/app` (no-live-session state)
- **Component:** Player home “Next up” card, `src/app/app/page.tsx`
- **User role:** Player / Queue Master viewing player home
- **UI state:** No live session; empty/upcoming state
- **Viewport:** 390×844, 1440×900
- **Severity:** P2
- **Expected:** 20px of breathing room below the title inside the dark header and a clear start to the white body.
- **Actual (before):** Header used `px-5 py-4`; the title sat about 16px from the boundary and the body began immediately after it. The two text regions read as one crowded block.
- **Measured before:** title bottom → header bottom ≈16px measured from the baseline capture; section headline/body gap 36px total.
- **Likely root cause:** Shared live/next-up header pattern used symmetric 16px vertical padding without a dedicated bottom rhythm; title had no line-height adjustment for wrapping.
- **Confirmed root cause:** `py-4` header padding plus `mt-0.5` title margin; both the live and no-live headers duplicated the pattern.
- **Fix:** Header is now `pt-4 pb-5`; eyebrow → title gap is `mt-1`; title uses `leading-snug` and `line-clamp-2` for wrapping. Applied to both `LiveSummary` and the no-live “Next up” card.
- **Measured after:** header height 80px; title bottom → header bottom **20px**; header → body 0 (body starts after the header); body content top padding **20px**; total title → first body text **40px**.
- **Files:** `src/app/app/page.tsx`
- **Regression test:** `tests/e2e/audit/spacing-audit.mjs` (page overflow, overlap, clipped text); `tests/e2e/tests/ui-spacing.spec.ts` (card padding, section gaps).
- **Verification:** 390/1440 Chromium and WebKit; screenshots `before/ui-001-next-up-390.jpg` and `after/ui-001-next-up-390.png`.
- **Status:** Fixed / Verified.

## UI-002 — Player Record hierarchy

- **Route/Page:** `/app` (desktop player home)
- **Component:** Player home “Player record” card
- **User role:** Player
- **UI state:** Populated stats
- **Viewport:** 1440×900
- **Severity:** P2
- **Expected:** Clear separation between the section label, 100% value, and the three supporting metrics; the suffix should not collide with the value.
- **Actual (before):** Label → value 12px and value → metrics 12px. The “win rate” suffix was 4px from the percentage and baseline-aligned, while metric labels were 0.55rem.
- **Measured before:** `labelToValue = 12px`, `valueToStats = 12px` (baseline probe).
- **Likely root cause:** Ad-hoc `mt-3` values and a 4px flex gap inside a card whose siblings used different rhythm.
- **Confirmed root cause:** The card had no shared stat hierarchy pattern; it was hand-composed with `mt-3`/`gap-1` and 0.55rem labels.
- **Fix:** Label → value `mt-4` (16px); suffix gap `gap-2` with `pb-1`; value → metrics `mt-4` (16px); metric boxes `py-2.5 px-1.5`, value `text-lg`, label 0.62rem with `mt-0.5`; loading skeleton and action gaps adjusted to 16/20px.
- **Measured after:** `labelToValue = 16px`, `valueToStats = 16px`; card width unchanged at 323px; all three metric boxes share the same top.
- **Files:** `src/app/app/page.tsx`
- **Regression test:** `ui-spacing.spec.ts` stat-card top-edge assertion; spacing audit stat label rule.
- **Verification:** 1440/390, Chromium/WebKit; `before/ui-002-player-record-1440.png`, `after/ui-002-player-record-1440.png`.
- **Status:** Fixed / Verified.

## UI-003 — Dashboard consistency

- **Route/Page:** `/app` and `/manage`
- **Component:** `PageHeader`, `SectionHeading`, `Card`, `SessionCard`, main/aside grids
- **User role:** Player, Queue Master
- **UI state:** Live, upcoming, empty
- **Viewport:** 320–1920
- **Severity:** P2
- **Expected:** Section heading and description visibly separated; consistent card insets; gutters that do not collapse into cramped two-column layouts at 1024px.
- **Actual (before):** `SectionHeading` description used `mt-0.5` (2px). Two-column dashboard grids activated at `lg` (1024px), leaving the right rail 148–165px wide after the sidebar appeared; session/club names clipped. Card content defaulted to `pt-0` when no `CardHeader` existed.
- **Measured before:** Section title → description **2px**; player home right rail **148px** at 1024; card content inset in bare `CardContent` **0px top**.
- **Likely root cause:** Shared typography used a 2px description gap; dashboards changed column count at the same breakpoint as the sidebar; `CardContent` was designed for an unused header pattern.
- **Confirmed root cause:** `mt-0.5` in `SectionHeading`; `lg:grid-cols` on player/dashboard grids; `CardContent` default `pt-0`.
- **Fix:** `SectionHeading` description `mt-2` and heading `mb-4`; player, QM, club, and member dashboards stack until `xl`; grids use `minmax(0, …)`; `CardContent` defaults to full `p-5 sm:p-6`; dashboards use 2-column stat grids on mobile; card grids remain 12px.
- **Measured after:** Section title → description **8px** on every audited route; no dashboard rail narrower than its content; card content insets 16–24px.
- **Files:** `src/components/ui/page.tsx`, `src/components/ui/card.tsx`, `src/components/session/session-card.tsx`, `src/app/app/page.tsx`, `src/app/manage/page.tsx`, `src/app/manage/clubs/[clubId]/page.tsx`, `src/app/manage/clubs/[clubId]/members/page.tsx`
- **Regression test:** section-heading and card-padding rules in `spacing-audit.mjs`; `ui-spacing.spec.ts`.
- **Verification:** Full matrix; `before/ui-003-dashboard-1440.png`, `after/ui-003-dashboard-1440.png`.
- **Status:** Fixed / Verified.

## UI-004 — Character encoding

- **Route/Page:** 26 source files across player, QM, auth, public, and shared components
- **Component:** User-visible copy and README
- **User role:** All
- **UI state:** All
- **Viewport:** All
- **Severity:** P0
- **Expected:** UTF-8 punctuation (en/em dash, middle dot, ellipsis, curly apostrophe) renders as intended; no BOMs.
- **Actual (before):** Sequences such as `â€”`, `Â·`, `â€¦`, `â€“` and UTF-8 BOM markers appeared in source and on screen. The 2026-10-25 screenshot shows “teams â€” never who gets left out”.
- **Measured before:** 26 frontend files changed, 102 substitutions; BOMs in multiple TSX/README files.
- **Likely root cause:** Files were saved/re-encoded through Windows-1252 at some point, and editors preserved BOMs.
- **Confirmed root cause:** Byte-level re-encoding; not a CSS issue.
- **Fix:** Replaced sequences with intended Unicode punctuation, stripped BOMs, and added `scripts/check-encoding.mjs`. The guard runs in `pnpm lint` and before `pnpm build`, and fails on BOM, U+FFFD, and known mojibake prefixes.
- **Measured after:** Encoding guard reports zero issues; rendered screenshots show “teams — never”; no U+FFFD/BOM in `src`, `public`, `README.md`, or `package.json`.
- **Files:** 26 frontend files plus `scripts/check-encoding.mjs`, `package.json`; backend `README.md` and `src/clubs/routes.ts` (BOM-only PR).
- **Regression test:** `pnpm check:encoding` (wired into lint/build); screen-level punctuation remains covered by Playwright text assertions in the scoring/public specs.
- **Verification:** `pnpm lint`, `pnpm build`; `before/ui-004-encoding-1440.png`, `after/ui-004-encoding-1440.png`.
- **Status:** Fixed / Verified.

## UI-005 — Player home 320px overflow

- **Route/Page:** `/app`
- **Component:** Live summary action row, main grid child
- **User role:** Player
- **UI state:** Live/queued
- **Viewport:** 320×568 (WebKit and Chromium)
- **Severity:** P1
- **Expected:** Document width equals viewport; both actions reachable.
- **Actual (before):** Document **325px** at a 320px viewport; “View my queue” and “Session details” formed an unshrinkable row.
- **Measured before:** `documentWidth 325`, viewport 320; main card 309px.
- **Likely root cause:** Two `whitespace-nowrap` buttons in a non-wrapping flex row set the card min-content width; the grid child lacked `min-w-0`.
- **Fix:** `flex flex-wrap` on both live-card action rows; `min-w-0` on the main grid child/aside; live-card club name uses `line-clamp-2` instead of one-line truncation.
- **Measured after:** `documentWidth 320`, viewport 320; buttons wrap; no clipped labels.
- **Files:** `src/app/app/page.tsx`
- **Regression test:** `ui-spacing.spec.ts` player overflow assertion; spacing audit document-overflow rule.
- **Verification:** 320/390 Chromium/WebKit; `before/ui-005-player-home-320.png`, `after/ui-005-player-home-320.png`.
- **Status:** Fixed / Verified.

## UI-006 — QM dashboard 320px overflow

- **Route/Page:** `/manage`
- **Component:** Live-session hero stat row
- **User role:** Queue Master
- **UI state:** Live
- **Viewport:** 320×568
- **Severity:** P1
- **Expected:** No page horizontal scroll; three stat values readable.
- **Actual (before):** Document **343px** at 320px; the three `grid-cols-3` stat boxes with 12px horizontal padding set a 268px min-content inside a 260px card.
- **Measured before:** `documentWidth 343`, viewport 320.
- **Likely root cause:** Hard-coded `px-3` boxes and long uppercase labels in a 3-column grid; the parent grid lacked `min-w-0`.
- **Fix:** Box padding `px-2 sm:px-3`, label 0.55rem mobile with tighter tracking, value `text-xl sm:text-2xl`, `min-w-0` on boxes and grid children; dashboard stacks below 1280px; stat grid is 2-up on mobile.
- **Measured after:** `documentWidth 320`; boxes 2-up; no clipped labels.
- **Files:** `src/app/manage/page.tsx`
- **Regression test:** spacing audit document overflow at 320; `ui-spacing.spec.ts`.
- **Verification:** 320 Chromium/WebKit; `before/ui-006-qm-dashboard-320.png`, `after/ui-006-qm-dashboard-320.png`.
- **Status:** Fixed / Verified.

## UI-007 — QM check-in overflow

- **Route/Page:** `/manage/sessions/[sessionId]/check-in`
- **Component:** Status/type `Segmented` tab strips, search, roster grid
- **User role:** Queue Master
- **UI state:** Populated (13 participants)
- **Viewport:** 320×568, 390×844
- **Severity:** P0
- **Expected:** Page equals viewport; tabs either fit or scroll in their own bounded strip; search and roster fully visible.
- **Actual (before):** Document **405px** at 390 and 320. The first tab strip's min-content width was 389px inside a 358px content box; the search inherited the width; the page used `overflow-x-hidden` to mask the overflow.
- **Measured before:** `documentWidth 405`; tab strip 389px; page content 358px.
- **Likely root cause:** `Segmented` used `inline-flex` with `flex-1` children whose min-content could not shrink; the grid child lacked `min-w-0`; `overflow-x-hidden` concealed the clipping.
- **Fix:** `Segmented` now renders a bounded `overflow-x-auto` wrapper around a `w-max min-w-full` list; mobile button padding is `px-3`; buttons have 44px minimum height; check-in grid child and search are `min-w-0`; the page no longer masks overflow; filters stack vertically so the search field is never squeezed.
- **Measured after:** `documentWidth 320` at 320, `390` at 390; tab strip scrolls internally at 320 (357px content, 288px box), fits at 390; search full width below tabs at all sizes; 0 clipped text.
- **Files:** `src/components/ui/segmented.tsx`, `src/app/manage/sessions/[sessionId]/check-in/page.tsx`
- **Regression test:** `ui-spacing.spec.ts` check-in test (document width + bounded wrapper); spacing audit at 320/390.
- **Verification:** Chromium/WebKit 320/390, screenshots `before/ui-007-qm-check-in-390.png`, `after/ui-007-qm-check-in-390.png`.
- **Status:** Fixed / Verified.

## UI-008 — Session wizard overflow

- **Route/Page:** `/manage/sessions/new`
- **Component:** Four-step rail and form grid
- **User role:** Queue Master
- **UI state:** Step 1, narrow phone
- **Viewport:** 320×568, 390×844
- **Severity:** P0
- **Expected:** Document equals viewport; step rail scrolls within its own row; every field reachable.
- **Actual (before):** Document **445px** at 320/390; step rail content 429px; form card inherited the width and fields were clipped.
- **Measured before:** `documentWidth 445`; step rail 429px.
- **Likely root cause:** Grid item lacked `min-w-0`; the `overflow-x-auto` rail could not constrain the parent's min-content.
- **Fix:** `min-w-0` on the wizard grid columns; rail is `w-full max-w-full` with `shrink-0` step buttons; labels remain full-size; buttons get 44px mobile height.
- **Measured after:** `documentWidth 320`/`390`; rail scrolls internally; form fields fit; 0 clipped text.
- **Files:** `src/components/manage/session-wizard.tsx`
- **Regression test:** `ui-spacing.spec.ts` wizard test; spacing audit.
- **Verification:** Chromium/WebKit 320/390; `before/ui-008-qm-wizard-390.png`, `after/ui-008-qm-wizard-390.png`.
- **Status:** Fixed / Verified.

## UI-009 — 320px public/player header clipping

- **Route/Page:** `/public/sessions/[publicId]`, `/public/clubs/[slug]`, `/app`
- **Component:** `PublicHeader`, `AppShell` mobile header
- **User role:** Guest / player
- **UI state:** Default
- **Viewport:** 320×568 (WebKit)
- **Severity:** P1
- **Expected:** Logo, sign-in and profile entry points fit; marketing CTA is hidden or wrapped.
- **Actual (before):** Public document **370px** at 320; “Run your club” was cut off. Player home had 5px overflow.
- **Measured before:** Public 370px, player home 325px.
- **Likely root cause:** Full logo + Sign in + Run your club + gaps exceeded 320px; no wrapping/shrink strategy.
- **Fix:** Public header uses `px-4` with `gap-3`, logo link has a 44px hit area, and the secondary “Run your club” CTA is hidden below `sm` (Sign in remains). AppShell mobile logo/profile hit areas are 44px.
- **Measured after:** Public and player documents equal 320; sign-in remains reachable; 0 clipped header labels.
- **Files:** `src/components/public/public-shell.tsx`, `src/components/layout/app-shell.tsx`, `src/app/(auth)/layout.tsx`
- **Regression test:** `ui-spacing.spec.ts` player routes; spacing audit public routes.
- **Verification:** 320 Chromium/WebKit; `before/ui-009-public-session-320.png`, `after/ui-009-public-session-320.png`.
- **Status:** Fixed / Verified.

## UI-010 — Member name/email clipping

- **Route/Page:** `/manage/clubs/[clubId]/members`
- **Component:** Active/pending/suspended member rows
- **User role:** Owner / Queue Master
- **UI state:** Populated
- **Viewport:** 320/390
- **Severity:** P1
- **Expected:** Names/emails readable; no 9px-wide text column.
- **Actual (before):** Member names displayed in 9px of content at 320px; role select and remove button competed on the same line.
- **Measured before:** Name client width **9px**, scroll width 75–101px; email lines clipped.
- **Likely root cause:** A `min-w-0 flex-1` text block could shrink to near-zero beside a fixed-width select and icon button.
- **Fix:** Text block has `min-w-[10rem]`, forcing actions to wrap below on narrow cards; names use `truncate` with `title`; emails `break-all` instead of `truncate`; select is 44px tall on mobile; icon button uses the shared 44px mobile size.
- **Measured after:** Names get a full 160px basis at 320; no clipped text; actions wrap.
- **Files:** `src/app/manage/clubs/[clubId]/members/page.tsx`
- **Regression test:** spacing audit clipped-text rule; full matrix.
- **Verification:** 320/390; `before/ui-010-qm-members-390.png`, `after/ui-010-qm-members-390.png`.
- **Status:** Fixed / Verified.

## UI-011 — “More” account name clipping

- **Route/Page:** `/manage/more`
- **Component:** Account card
- **User role:** Queue Master
- **UI state:** Default
- **Viewport:** 320
- **Severity:** P2
- **Expected:** Full account name visible; role badge wraps if needed.
- **Actual (before):** “Morgan Lee” clipped to a 56px content box by the “Queue Master” badge.
- **Measured before:** clientWidth 56, scrollWidth 101.
- **Likely root cause:** Non-wrapping flex row with a shrinking text block.
- **Fix:** Row uses `flex-wrap`; text block has `min-w-[10rem]`; badge wraps to the next line; email truncates with a title-free single line but is short.
- **Measured after:** Name full width; badge wraps; no clipped text.
- **Files:** `src/app/manage/more/page.tsx`
- **Regression test:** spacing audit clipped-text rule.
- **Verification:** 320; `after/ui-011-qm-more-320.png`.
- **Status:** Fixed / Verified.

## UI-012 — Live-board team names clipped

- **Route/Page:** `/manage/sessions/[sessionId]`
- **Component:** Court cards, matches-in-progress cards, rotation preview
- **User role:** Queue Master
- **UI state:** Live / rotation preview
- **Viewport:** 1024×768
- **Severity:** P2
- **Expected:** Full player names readable or deliberately clamped with a reveal.
- **Actual (before):** “Diego Santos + Maria Lopez” was a single-line `truncate` at 137px; at 1024 the two-column court grid left 70px for names and showed “Sam Pate…”/“Diego Sant…”.
- **Measured before:** clientWidth 137, scrollWidth 160 (mobile court card); 1024 two-column court cards ~174px.
- **Likely root cause:** `truncate` on team-name paragraphs and a two-column court grid inside a 340–380px cockpit column.
- **Fix:** Team/score names use `line-clamp-2 break-words`; the court grid is `sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2`, so the 1024 cockpit uses one readable court column and 1280+ returns to two; action groups wrap.
- **Measured after:** No clipped text at 1024/1440; team names wrap to two lines; courts and next rotation remain co-visible at 1024.
- **Files:** `src/app/manage/sessions/[sessionId]/page.tsx`, `src/components/match/score-card.tsx`
- **Regression test:** spacing audit clipped-text/overlap rules; visual screenshot.
- **Verification:** 1024 Chromium/WebKit; `before/ui-012-session-board-1024.png`, `after/ui-012-session-board-1024.png` (recaptured after the court-grid change).
- **Status:** Fixed / Verified.

## UI-013 — Touch targets

- **Route/Page:** All authenticated/public pages
- **Component:** `Button`, `Segmented`, `ClubAdminNav`, wizard step rail, selects, logo links
- **User role:** All
- **UI state:** All
- **Viewport:** 320–430
- **Severity:** P1
- **Expected:** Primary controls ≥44px; standalone links at least 24px.
- **Actual (before):** Small buttons 36px; segmented tabs 36px; club nav 36px; step rail 36px; selects 32px; logo links 20–42px; “Forgot password?” 16px.
- **Measured before:** 36–42px controls; 16px links.
- **Likely root cause:** Sizes were fixed at desktop values; no mobile growth rule.
- **Fix:** Shared `sm`/`icon-sm` buttons become 44px below 640px; segmented buttons 44px; club nav and wizard step items 44px; selects 44px; logo links 44px; standalone links get `min-h-6` (24px).
- **Measured after:** Remaining spacing-audit advisories are 24px inline links and a few 32–34px secondary icon controls; **no sub-24px targets**. This meets WCAG 2.2 AA 24px; 44px is the documented recommendation for primary controls.
- **Files:** `src/components/ui/button.tsx`, `src/components/ui/segmented.tsx`, `src/components/manage/club-admin-nav.tsx`, `src/components/manage/session-wizard.tsx`, `src/components/layout/app-shell.tsx`, `src/components/public/public-shell.tsx`, auth/session/club pages.
- **Regression test:** `spacing-audit.mjs` target-size rule (24px error, 44px mobile warning).
- **Verification:** 320/390 full audit; 34 advisories, 0 errors.
- **Status:** Fixed (primary controls) / Advisories documented.

## UI-014 — Public scoreboard legibility

- **Route/Page:** `/public/sessions/[publicId]/scoreboard`
- **Component:** `PublicScoreboardView`
- **User role:** Guest / spectator
- **UI state:** Live and open-court
- **Viewport:** 320–1920, TV mode
- **Severity:** P2
- **Expected:** Readable at distance and on 320px screens; no clipped team names.
- **Actual (before):** Skill/meta text at 0.55–0.62rem and white/30–40; team names single-line `truncate`; 6xl score left 152px, clipping “Diego S. + Maria L.”.
- **Measured before:** name clientWidth 152, scrollWidth 164; contrast risk flagged in the prior audit.
- **Likely root cause:** Dense scoreboard typography kept desktop sizes on mobile; `truncate` without fallback.
- **Fix:** Team names `line-clamp-2` at `text-base sm:text-lg`; skill line 0.68rem/60% white; footer/meta 0.62rem/55–60%; “Exit” and “Upcoming & results” have 44px/24px hit areas.
- **Measured after:** No clipped text at 320; screenshot shows full “Sam P. + Priya N.” / “Diego S. + Maria L.”; automation has no contrast assertions, so manual review remains.
- **Files:** `src/components/public/public-scoreboard-view.tsx`, `src/components/public/public-match-card.tsx`
- **Regression test:** spacing audit at 320/390; existing axe runs in the audit harness.
- **Verification:** `before/ui-014-scoreboard-320.png`, `after/ui-014-scoreboard-320.png`.
- **Status:** Fixed / Verified for layout; contrast re-check recommended with a colour-contrast tool.

## UI-015 — Tablet cockpit / QR placement

- **Route/Page:** `/manage/sessions/[sessionId]`, `/manage/sessions/[sessionId]/check-in`
- **Component:** Session board and check-in main grids
- **User role:** Queue Master
- **UI state:** Live / check-in open
- **Viewport:** 1024×768
- **Severity:** P1
- **Expected:** Courts, next rotation and waiting queue co-visible; QR visible beside the roster at 1024.
- **Actual (before):** Both grids activated at `xl` (1280). At 1024 the board stacked and the QR panel fell below a long roster.
- **Measured before:** Single column at 1024; QR below 13 rows.
- **Likely root cause:** Content breakpoints lagged the shell breakpoint (sidebar at 1024).
- **Fix:** Board and check-in grids now activate at `lg` with `minmax` columns: board `minmax(0,1.2fr)/minmax(20rem,0.8fr)`, check-in `minmax(0,1fr)/18rem` (20rem at xl). Court cards use one column at 1024 for readable names.
- **Measured after:** At 1024, courts + next rotation and roster + QR are side by side; no page overflow; check-in search stacks above the roster.
- **Files:** `src/app/manage/sessions/[sessionId]/page.tsx`, `src/app/manage/sessions/[sessionId]/check-in/page.tsx`
- **Regression test:** full-width audit at 1024; screenshot.
- **Verification:** `before/ui-012-session-board-1024.png`, `after/ui-012-session-board-1024.png`, `before/ui-013-check-in-1024.png`, `after/ui-013-check-in-1024.png`.
- **Status:** Fixed / Verified.

## UI-016 — Repeated card rhythm and drift

- **Route/Page:** Player, QM, club, public lists
- **Component:** `Card`, `StatCard`, `SessionCard`, list rows
- **User role:** All
- **UI state:** Dense/populated
- **Viewport:** All
- **Severity:** P3
- **Expected:** Repeated cards in the same family share padding, height rhythm, and icon gaps.
- **Actual (before):** Cards used `p-4`, `p-5`, `p-6`, `mt-3`, `mt-0.5`, and 0.55–0.68rem labels without a documented scale.
- **Fix:** Documented scale in `spacing-standard.md`; standard cards 20/24, compact 16; stat cards 16 with 10/4px internal gaps; session cards 16/20; labels raised to a 0.62rem floor in dense metrics; action groups 8px and wrapping.
- **Files:** Shared primitives and session cards.
- **Regression test:** card-padding and stat-gap rules in `spacing-audit.mjs`.
- **Verification:** 400-screen full audit, 0 errors.
- **Status:** Fixed / Verified.

---

## Deferred issues

### UI-017 — Rotation preview can appear below the fold

- **Priority:** P1 (inherited UX-05)
- **Route:** `/manage/sessions/[sessionId]`
- **Reason deferred:** Fixing this well needs a focus/announcement pattern and a deliberate tablet placement decision (right rail vs sheet), not a spacing tweak. The 1024 grid now keeps the Next rotation rail visible, which removes most of the risk on the intended tablet. At 768–1023 the preview can still render below the matches list.
- **Remaining risk:** A Queue Master on a narrow tablet may tap Generate and not see the preview. Mitigation: the right rail is co-visible at 1024+, and the button reflects busy state.
- **Recommended next step:** Add a preview landmark, `scrollIntoView({ block: 'nearest' })` after a fresh preview, and a `role="status"` announcement.

### UI-018 — No live announcements for score/queue changes

- **Priority:** P0 accessibility (inherited A11Y-03)
- **Reason deferred:** It requires a considered polite/assertive live-region design across socket events to avoid announcement storms; it is not a spacing defect and changes interaction behavior.
- **Remaining risk:** Screen-reader users do not hear live score or queue changes. Existing axe scans do not test this.
- **Recommended next step:** A single visually hidden `aria-live="polite"` region with debounced, human-readable summaries on the player queue, live board, and public scoreboard.

### UI-019 — 200% text scaling

- **Priority:** P1 accessibility (inherited A11Y-05)
- **Actual:** Re-ran `tests/e2e/audit/zoom-smoke.mjs` against the remediated UI (20px root raised to 32px):
  - sign-in 1180: pass
  - player queue 390: **overflow 453px**
  - QM session board 1180: **overflow 1304px**
  - QM check-in 1180: **overflow 1240px**
  - scoring 1180: pass
  - public scoreboard 1180: pass
- **Reason deferred:** Fixing the three failures requires a dedicated 200% typography pass: fixed-height controls, two-column cockpit tracks, and non-scaling `w-*`/`h-*` utilities all need rem-based alternatives or explicit 200% fallbacks. It is materially larger than the spacing pass and would risk the verified 100% layouts.
- **Remaining risk:** Users who enlarge text can still hit horizontal scroll on the player queue and QM board/check-in. The default-size 400-screen matrix passes.
- **Recommended next step:** Add 200% screenshots to the release gate, then convert the fixed heights/tracks in the three failing screens to `min-height`/`rem` and retest.

### UI-020 — Authenticated visual baselines for dynamic pages

- **Priority:** P2
- **Reason deferred:** The seeded demo data uses live clocks, elapsed waits, and match scores; full-page screenshot diffs would be nondeterministic without freezing the seed clock and masking live regions. The existing visual project only covers static sign-in/offline pages. The new geometry gate covers critical overflow/overlap/spacing on every PR.
- **Remaining risk:** A purely visual regression in an authenticated page could pass geometry checks. Manual screenshot review remains part of the release checklist.
- **Recommended next step:** Add a deterministic seed mode with a fixed clock, then add player-home, QM board, check-in, and scoreboard baselines with masked live counters.

### Environmental limitations

- **Physical devices:** No physical iPhone/iPad was attached during this pass; WebKit viewports at 320/390/768/1024/1180 are the proxy.
- **Firefox:** The prior audit covered Firefox; this spacing pass used Chromium and WebKit. Re-run `firefox-smoke.mjs` before release.
- **Colour contrast:** Contrast was improved but not re-measured with a dedicated contrast checker; the prior axe findings should be re-run after deployment.
- **CI:** The frontend repository has no GitHub Actions workflow (removed intentionally in an earlier change). The commands are documented in `regression-coverage.md`; wiring them into CI is a repository-owner decision.

## Root-cause fixes applied

1. **Shared min-width contract:** grid/flex children that contain text now use `min-w-0`; two-column grids use `minmax(0, …)`.
2. **Bounded scroll instead of page overflow:** `Segmented` and the wizard step rail scroll inside their own containers; the page no longer masks overflow with `overflow-x-hidden`.
3. **Header/description rhythm:** page and section heading gaps standardized at 8px; section bottom spacing 16px.
4. **Card padding contract:** `CardContent` defaults to full 20/24px padding; compact cards explicitly use 16px.
5. **Mobile touch growth:** small controls grow to 44px below 640px; standalone text links get 24px.
6. **Responsive stacking:** dashboards stack below 1280px; QM cockpit grids activate at 1024px; stat grids use 2 columns on mobile.
7. **Text reveal over blind truncation:** session/team names use two-line clamps or title-bearing truncation; emails break rather than disappear.
8. **Encoding guard:** source/build failure on mojibake, replacement characters, or BOMs.
