# PickleQueue spacing and alignment standard

**Status:** adopted 2026-10-26  
**Basis:** existing Tailwind 4 spacing scale and the current card/typography components. No new CSS framework or parallel token system was introduced.

## 1. Scale

Tailwind's `--spacing` unit is 0.25rem (4px). The project uses this scale directly; the semantic names below are documentation, not new variables.

| Token | Tailwind | Value | Use |
| --- | --- | --- | --- |
| space-1 | `1` | 4px | Icon ↔ text, badge dot, hairline relationships |
| space-2 | `2` | 8px | Heading ↔ description, button groups |
| space-3 | `3` | 12px | Compact rows and list gaps |
| space-4 | `4` | 16px | Standard compact card padding, header ↔ actions |
| space-5 | `5` | 20px | Standard card padding, content section gap |
| space-6 | `6` | 24px | Desktop card padding, major content blocks |
| space-8 | `8` | 32px | Large section separation |
| space-10 | `10` | 40px | Marketing/landing blocks |
| space-12 | `12` | 48px | Page-level separation on wide screens |

No arbitrary `margin` values are used to compensate for a component defect. The only common arbitrary values are historical component dimensions (`rounded-[1.35rem]`, header heights) and typographic font sizes; they are not spacing tokens.

## 2. Component rules

### Cards

| Card type | Padding | Examples |
| --- | --- | --- |
| Standard | 20px mobile, 24px ≥640px | `CardContent` defaults, dashboard cards |
| Compact | 16px | `SessionCard`, `UpcomingSessionCard`, stat cards, participant rows |
| Surface with header | header 20/24px; body 20/24px | Live summary and “Next up” card |
| Empty/error | 24px horizontal, 48px vertical | `EmptyState`; `ErrorState` p-6 |

- `CardContent` now defaults to full padding (`p-5 sm:p-6`). A card that uses `CardHeader` must explicitly apply `pt-0` to its content; no current screen uses `CardHeader`.
- Content inset target: **12–32px**. Standard cards sit at 20/24; compact cards at 16.
- Card radius stays `1.35rem`; stat cards `1rem`; hero cards `1.5–1.6rem`. These are existing identity values and were not changed.
- Cards never rely on `overflow: hidden` to hide content. Overflow clipping is used only for decorative layers or a bounded internal scroll region.

### Page header

| Relationship | Target | Implementation |
| --- | --- | --- |
| Eyebrow ↔ title | 6px | `mb-1.5` |
| Title ↔ description | 8px | `mt-2` |
| Header ↔ first content block | 20–24px | page `space-y-6` |
| Title ↔ actions (desktop) | 16px | `gap-4` |
| Title/description ↔ actions (mobile) | 16px | stacked column, `gap-4` |

### Section heading

| Relationship | Target | Implementation |
| --- | --- | --- |
| Title ↔ description | 8px | `mt-2` (was 2px) |
| Section ↔ next block | 16px | `mb-4` (was 12px) |
| Heading ↔ right-side action | 12px | `gap-3` |
| Long title wrapping | allowed | `break-words`, `min-w-0` |

### Statistics

| Relationship | Target | Implementation |
| --- | --- | --- |
| Card padding | 16px | `p-4` |
| Label ↔ value | 10px | `mt-2.5` |
| Value ↔ hint | 4px | `mt-1` |
| Player-record label ↔ value | 16px | `mt-4` |
| Value ↔ supporting label | 8px | `gap-2`; suffix uses `pb-1` |
| Record value ↔ metric row | 16px | `mt-4` |
| Metric boxes | 10px vertical, 6px horizontal | `py-2.5 px-1.5` |
| Metric value | 18px | `text-lg`; small metric label 0.62rem |

Budget values, percentages and units must never share a baseline without a gap. The player-record suffix is baseline-aligned to the bottom of the value with an 8px gap.

### Forms

| Relationship | Target |
| --- | --- |
| Label ↔ control | 6px (`space-y-1.5`) |
| Control ↔ hint/error | 6px |
| Field ↔ field | 16px (`space-y-4`) |
| Control height | 44px (`h-11`) |
| Inline icon inset | 12px left, 16px right |

Validation errors stay in the field stack and must not shift adjacent controls horizontally.

### Buttons and touch targets

| Rule | Value |
| --- | --- |
| Standard height | 44px (`h-11`) |
| Small height | 36px desktop; **44px on mobile** (`max-sm:h-11`) |
| Icon button | 44×44 default; 36×36 desktop small; **44×44 mobile** |
| Button group gap | 8px (`gap-2`); wrap on narrow cards |
| Segmented buttons | 36px desktop; 44px mobile; bounded horizontal scroll |
| Standalone text links | minimum 24px high (WCAG 2.2 AA); 44px recommended |

The small button variant deliberately remains visually smaller on desktop but grows to a 44px touch target below 640px. Inline text links inside a paragraph are the documented exception to 44px; they retain 24px where they are standalone.

### Icons, badges and counters

- Icon ↔ label: 6px (`gap-1.5`); vertically centred with the text line, not baseline-aligned.
- Icon sizes: 14px (`size-3.5`) in dense rows, 16px (`size-4`) in standard actions, 20px in empty-state callouts.
- Badge padding: 10px horizontal, 4px vertical; 6px gap to a dot.
- Counts inside segmented controls use the same 6px gap and tabular figures.
- Icons never touch a card edge: minimum 12px inset, 20px in standard cards.

### Grids and gutters

| Context | Gap |
| --- | --- |
| Page section stack | 20px (`space-y-5`) or 24px (`space-y-6`) |
| Dashboard main/aside | 20px (`gap-5`) |
| Card grids (sessions, courts) | 12px (`gap-3`) |
| Stat grids | 12–16px (`gap-3`/`gap-4`) |
| Form grids | 16px (`gap-4`) |
| Compact lists | 8px (`space-y-2`) |
| Inline action groups | 8px (`gap-2`) |

Every grid/flex child that contains shrinkable text uses `min-w-0`. Two-column layouts use `minmax(0, …)` so long words cannot widen the page. Dashboards stack below 1280px; the session board and check-in adopt their two-column cockpit at 1024px.

## 3. Responsive rules

1. **No page-level horizontal scroll** at 320–1920px. Horizontal scrolling is allowed only inside a deliberately bounded tab strip, step rail, or admin nav with `overflow-x: auto`.
2. **No fixed heights for text containers.** Cards grow with wrapped text.
3. **Prefer wrapping to clipping.** Session, club, player and team names use `line-clamp-2`/`break-words`; `truncate` is only used where a `title` or link supplies the full value.
4. **Long unbroken strings** (emails, tokens) use `break-all` or `overflow-wrap`.
5. **Mobile-first padding.** Standard cards are 20px below 640 and 24px above; compact cards stay 16px at every width.
6. **Touch targets** grow, not shrink, on mobile.
7. **No negative margins or absolute positioning** to correct a spacing defect. The only negative margins retained are the existing avatar stack (`-space-x-2`) and back-link optical alignment (`-ml-2`).

## 4. Where the rules are enforced

- Shared primitives: `src/components/ui/{card,page,button,badge,input,feedback,segmented}.tsx`.
- Semantic hooks: `data-ui="card"`, `card-content`, `page-header`, `page-title`, `page-description`, `section-heading`, `section-title`, `section-description`, `stat-card`, `stat-label`, `stat-value`, `field`, `segmented`, `segmented-list`.
- Automated rules: `tests/e2e/audit/spacing-audit.mjs` and `tests/e2e/tests/ui-spacing.spec.ts`.
- Encoding guard: `Frontend/Courtside-Frontend/scripts/check-encoding.mjs`, wired into `lint` and `build`.

## 5. Documented exceptions

| Exception | Reason | Risk |
| --- | --- | --- |
| Compact cards use 16px instead of 20px | Session/stat cards are intentionally denser than the dashboard cards | Low |
| 24px standalone text links | WCAG 2.2 AA minimum; inline links must stay inline | Low; below 44px advisory |
| Bounded internal scroll on QM tabs and wizard steps | Four labels cannot fit 288px without shrinking type below the legibility floor | Medium; users must discover horizontal scroll |
| Scoreboard TV mode keeps large score type | Readability at distance | Low |
| Full-page authenticated screenshot baselines are deferred | Seeded live scores/clocks change between runs; no fixed clock in the seed | Medium; geometry checks still run on every PR |

## 6. Verification summary

- Geometry audit: **400 screens** (2 engines × 10 widths × 20 routes) — see `responsive-audit.md`.
- Card content insets: all 12–32px.
- Section title → description: 8px on every audited page.
- Page overflow: 0 at 320–1920px.
- Clipped copy: 0 after the fixes.
- Remaining touch-target advisories: inline 24px text links and a small number of 32–40px secondary controls; none block a primary action.
