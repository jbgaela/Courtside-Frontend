# Accessibility audit — spacing and legibility pass

**Date:** 2026-10-26  
**Engine:** Chromium 156 headless, desktop 1440×900, WCAG 2 A/AA tags via axe-core  
**Command:** `pnpm --dir tests/e2e exec playwright test tests/accessibility.spec.ts --project=desktop-chromium`  
**Result:** **2/2 tests passed; 9 surfaces scanned; 0 serious or critical violations.**

## 1. Scanned surfaces

| Surface | Result | Notes |
| --- | --- | --- |
| Welcome | Pass | — |
| Player queue | Pass | — |
| Player home | Pass | — |
| Player match history | Pass | — |
| Public session | Pass | — |
| Queue Master dashboard | Pass | Added in this pass |
| Queue Master check-in | Pass | Added; QR SVG label fixed |
| Session wizard | Pass | Added |
| Public scoreboard | Pass | Added; contrast fixes verified |

Axe was configured to report `critical` and `serious` violations only, matching the existing suite. The full result set is retained in Playwright's HTML report; the suite fails on any serious/critical node.

## 2. Fixes made in this pass

| Issue | Fix | Evidence |
| --- | --- | --- |
| QR code had no accessible name | `QRCodeSVG title="QR code to check in to this session"` | Axe check-in scan now passes |
| Scoreboard small type/low contrast | Status/meta raised to `text-white/60–65`; team/score text 0.62–0.68rem; skill lines no longer 0.55rem | Axe scoreboard scan now passes; screenshot `after/ui-014-scoreboard-320.png` |
| Sub-24px targets | Standalone links now `min-h-6`; logo links 44px; buttons/selects 44px on mobile | Geometry audit: 0 errors; 34 advisories for 24px inline links / 32–40px secondary controls |
| Section heading/description crowding | 8px gap shared across pages | 400-screen geometry audit |
| Mobile overflow | No page-level horizontal scroll at 320–1920 | 400-screen geometry audit |

The 2026-10-25 audit's A11Y-01 (scoreboard contrast) and A11Y-02 (QR name) are now resolved and re-verified by axe. A11Y-04 (touch targets) is resolved for primary controls; remaining standalone 24px links meet WCAG 2.2 AA but are below the 44px recommendation.

## 3. WCAG 2.2 AA mapping

| Criterion | Status | Evidence / remaining work |
| --- | --- | --- |
| 1.4.1 Use of colour | Pass by inspection | Status is not colour-only: badges and labels carry text |
| 1.4.3 Contrast (minimum) | Pass on scanned routes | Axe 0 serious/critical; manual contrast check still recommended for custom lime/forest combinations |
| 1.4.4 Resize text (200%) | **Deferred — known failures** | `zoom-smoke.mjs`: player queue 390 (453px), QM board 1180 (1304px), check-in 1180 (1240px) overflow at 200%; sign-in/scoring/scoreboard pass. See UI-019. |
| 1.4.10 Reflow (320 CSS px / 400%) | Partial | 320px reflow passes; 400% browser zoom not re-tested |
| 1.4.12 Text spacing | Not separately tested | No fixed text-container heights in the remediated components; manual check recommended |
| 2.4.7 Focus visible | Existing rings retained | Not regressed by spacing changes; manual keyboard pass in prior audit |
| 2.5.8 Target size (minimum 24×24) | Pass | Geometry audit reports no sub-24 targets |
| 4.1.2 Name, role, value | Pass on scanned routes | QR name fixed; form labels/hints remain associated |
| 4.1.3 Status messages | **Deferred** | No live region for score/queue updates (UI-018) |

## 4. Manual checks still required

1. **Keyboard order** on the player home, QM board, check-in, and guest dialogs — the prior audit's focus trail is in `tests/e2e/audit/results/report.json`; re-run after merge.
2. **Screen-reader live updates** — socket-driven scores/queue changes are not announced. This is the largest remaining accessibility gap.
3. **200% / 400% zoom** — use the existing `zoom-smoke.mjs` and a real browser at 200% and 400%.
4. **Colour contrast outside axe-scanned pages** — auth error text, lime-on-white text, and modal footers.
5. **Screen reader on check-in QR** — verify the new SVG title is announced once, not as duplicate content.

## 5. Accessibility limitations

- Axe cannot prove a page is accessible; it only catches a subset of WCAG failures.
- The scan is Chromium only. WebKit/Safari and VoiceOver were not automated.
- No physical device was attached; touch target checks use CSS geometry.
- The scoreboard is designed for distance viewing; large type meets 3:1 for large text, but small metadata is the risk area addressed above.

## 6. Commands

```bash
# All accessibility specs (includes the new QM/scoreboard surfaces)
BASE_URL=http://localhost:3000 API_URL=http://localhost:4000 \
  pnpm --dir tests/e2e exec playwright test tests/accessibility.spec.ts --project=desktop-chromium

# Full audit axe samples (broader screens)
BASE_URL=http://localhost:3000 API_URL=http://localhost:4000 pnpm audit:ui
```
