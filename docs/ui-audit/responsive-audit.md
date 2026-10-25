# Responsive and device audit

**Date:** 2026-10-26  
**Automated matrix:** 2 engines × 10 widths × 20 routes = **400 screens**  
**Engines:** Chromium 156, WebKit 27.2 (Playwright 1.64.1)  
**Result:** **0 layout errors**; 130 touch-target advisories (see below).

## 1. Matrix

| Width | Purpose | Result |
| --- | --- | --- |
| 320 | Narrow mobile / iPhone SE class | Pass — no page overflow; internal tab/step scroll |
| 360 | Small Android | Pass |
| 375 | Compact phone | Pass |
| 390 | Common iPhone | Pass |
| 430 | Large phone | Pass |
| 768 | Tablet portrait | Pass — one column; bottom navigation |
| 1024 | Small laptop / tablet landscape | Pass — sidebar + QM cockpit at 1024 |
| 1280 | Laptop | Pass — full dashboard two-column |
| 1440 | Standard desktop | Pass |
| 1920 | Large desktop | Pass — capped 86rem content |

Each width uses a 900px viewport height (mobile widths use `isMobile`/`hasTouch`), `deviceScaleFactor 1`, `serviceWorkers: blocked`, reduced motion, and light colour scheme. The full run is in `tests/e2e/audit/spacing-results/report.json`; the PR-mode run uses 5 widths × 20 routes.

## 2. Before/after page widths

| Route | Viewport | Before | After | Main fix |
| --- | ---: | ---: | ---: | --- |
| Player home | 320 | **325** | **320** | Wrap action row, `min-w-0`, line-clamp club name |
| Player queue | 320 (WebKit) | **326** | **320** | `min-w-0` cards, `minmax(0, …)`, wrap list names |
| QM dashboard | 320 | **343** | **320** | Compact stat boxes, `min-w-0`, 2-up mobile stat grid |
| QM check-in | 390 | **405** | **390** | Bounded `Segmented` scroll, `min-w-0`, stacked filters |
| QM check-in | 320 | **405** | **320** | Same; 357px tabs scroll inside 288px |
| QM wizard | 390 | **445** | **390** | `min-w-0` grid item; bounded step rail |
| QM wizard | 320 | **445** | **320** | Same; rail scrolls internally |
| Public session | 320 | **370** | **320** | Hide secondary CTA, compact header, 44px logo hit area |
| QM club | 320 | **343** | **320** | `min-w-0`, wrap session title/status, 2-up stats |
| QM members | 320 | names 9px wide | full-width | `min-w-[10rem]`, wrapped actions, break emails |
| QM more | 320 | name 56/101px | full | Flex wrap + min-width |
| Session board | 1024 | single column | two-column cockpit | `lg` grid, `minmax` rail, single-column courts |

The full 400-screen run after remediation reports no document width above its viewport. The one WebKit 320 player-queue regression found in the first full run (326px) was fixed with `min-w-0`/`minmax` on the waiting-list and court cards; the final run is clean.

## 3. Breakpoint behaviour

| Range | Behaviour |
| --- | --- |
| <640 | Single-column pages; 44px controls; 2-up stat grids; bounded tab/step scroll; bottom nav; public CTA hidden |
| 640–1023 | Two-column cards/forms; 24px card padding; bottom nav remains |
| 1024–1279 | Sidebar (280px) appears; QM board and check-in two-column; player/QM/club dashboards stack (avoid a 148–165px rail) |
| ≥1280 | Player/QM dashboards two-column; full desktop grids |
| ≥1536 | Content capped at 86rem; no further layout changes |

Tested widths straddle 640/768/1024/1280; no page relies on one exact width.

## 4. Responsive scenarios

| Scenario | Result | Notes |
| --- | --- | --- |
| Normal wrapping | Pass | Long club/session names line-clamp at 2 lines |
| Long player/club/session names | Pass | Seeded names plus explicit long-text review on cards |
| Large participant counts | Pass | 13 participants, dense check-in rows |
| Empty queue/session | Pass | Empty states remain centered, buttons not cramped |
| Mobile navigation | Pass | 5-item bottom nav, 64px tall; sidebar at 1024 |
| Modals | Pass | Guest add/edit and remove dialogs use bottom-sheet layout below `sm` with safe-area padding |
| Touch controls | Partial | Primary actions 44px; 24px standalone links pass WCAG 2.2 but are below 44px |
| 200% text | **Known failures** | `zoom-smoke.mjs`: player queue 390 → 453px; QM board 1180 → 1304px; check-in 1180 → 1240px; sign-in, scoring, scoreboard pass. See UI-019. |
| 400% zoom/reflow | **Deferred** | 320px reflow passes; 400% not run |
| Orientation change | Pass (smoke) | 844×390 WebKit smoke of `/app`, QM board and check-in: document 844px, no overflow. Prior audit also covered 956×440. |
| Dynamic updates | Partial | Socket updates do not change layout width; live score text length is bounded |
| Safe areas | Pass by CSS | `safe-bottom`/`safe-top` retained; physical notch not verified |

## 5. Tablet cockpit

At 1024×768:
- Courts and Next rotation are side by side; waiting queue follows in the right rail.
- Court cards use one column at 1024 so “Sam Patel + Priya Nair” and “Diego Santos + Maria Lopez” are readable; 1280+ returns to two columns.
- Check-in roster and QR are side by side; the search field is full-width above the roster.
- The 1024 layout remains within 1024px; no horizontal page scroll.

At 768 (portrait) the board is one column, but the right rail follows immediately; the rotation preview is still below the court list. This is documented as deferred UI-017.

## 6. Typography and encoding

- Dense metadata floor raised from 0.55–0.6rem to 0.62–0.68rem on scoreboard, queue, member and stat surfaces.
- Heading descriptions use 8px separation and 1.6–1.7 line-height.
- All mojibake/BOMs removed; `pnpm check:encoding` is part of lint/build.
- Long words/emails use `break-all`/`line-clamp-2`; no page-width overflow.

## 7. Limitations

- Physical iOS/Android devices were not attached; WebKit viewports are the proxy. Verify notch, Safari dynamic toolbar, and real touch on at least one iPhone and one iPad before release.
- Firefox was not in this pass's spacing matrix. The prior audit's Firefox smoke is evidence for the baseline only; re-run `firefox-smoke.mjs`.
- The audit runs at 100% text size. 200% and 400% remain release risks.
- The automated overlap detector excludes fixed/sticky chrome and scroll-clipped geometry; manual screenshot review remains necessary.

## 8. Release gate

```bash
pnpm audit:spacing:full              # 400 screens
pnpm test:e2e                        # functional workflows
node tests/e2e/audit/firefox-smoke.mjs
node tests/e2e/audit/zoom-smoke.mjs   # 200% text
```
