# PickleQueue frontend inventory

**Audit date:** 2026-10-26  
**Repositories:** `Frontend/Courtside-Frontend` (UI), `Backend/Courtside-Backend` (API), umbrella `tests/e2e` harness  
**Scope:** every reachable App Router screen and shared UI family used by the player, Queue Master, club-admin, super-admin, and public roles.

## 1. Stack and visual system

| Concern | Implementation |
| --- | --- |
| Framework | Next.js 16.4 App Router, React 19.3, TypeScript 5.9 |
| Styling | Tailwind CSS 4.3 through `@tailwindcss/postcss`; no second CSS framework |
| Design tokens | `src/app/globals.css` — `@theme inline` maps semantic colours, fonts, radii, shadows; light palette only |
| Typography | Inter Variable (body), Manrope Variable (display), tabular numerals utility |
| Components | Bespoke primitives in `src/components/ui`; Radix Dialog for modals; lucide icons |
| Data | TanStack Query, Socket.IO session events, Sonner toasts |
| PWA | `manifest.ts`, `public/sw.js`, offline fallback page |
| Test stack | Backend Vitest/integration; umbrella Playwright harness in `tests/e2e`; axe-core; Playwright visual baselines |

There is no component library, CSS-in-JS layer, or alternate spacing utility system. The spacing work therefore had to reuse Tailwind's 4 px scale and the existing component APIs.

## 2. Layouts and route map

### Root and public shells

| Route | Layout | Access | Purpose |
| --- | --- | --- | --- |
| `/` | root | public | Marketing/welcome, live demo |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/activate`, `/claim-account`, `/recover-account`, `/mfa-setup`, `/registration-status`, `/registration-submitted` | `(auth)` | public / invitation | Authentication and registration |
| `/public/sessions/[publicId]` | public header/footer | public | Session detail and results |
| `/public/sessions/[publicId]/scoreboard` | full-screen public shell | public | TV scoreboard |
| `/public/clubs/[slug]` | public shell | public | Club discovery detail |
| `/check-in/[token]` | standalone | token holder | Self check-in |
| `/offline` | standalone | public | PWA offline fallback |
| `/privacy`, `/terms` | document shell | public | Legal |
| `/not-found`, `/error` | root | public | Error states |

### Player shell (`/app`)

| Route | Purpose | Empty/loading/error states |
| --- | --- | --- |
| `/app` | Player home, live status, upcoming sessions, stats, clubs | Yes — skeleton, empty, error, live, no-live, check-in |
| `/app/queue` | Position, progress, waiting list, pause/resume | Yes — empty, paused, playing, error |
| `/app/sessions/[id]` | Session detail, registration, check-in, courts | Yes — register/pending/checked-in/live/completed |
| `/app/matches` | Live matches and personal history tabs | Yes — empty history, loading, error |
| `/app/matches/[id]` | Match detail and score | Yes — live/completed/error |
| `/app/discover` | Club discovery | Yes — empty search |
| `/app/clubs/[slug]` | Club detail and sessions | Yes |
| `/app/clubs/new` | Create club | Validation errors |
| `/app/profile` | Profile and statistics | Yes |
| `/app/notifications` | Notification list | Yes |
| `/app/invitations/accept` | Invitation acceptance | Token states |

### Queue Master / club-admin shell (`/manage`)

| Route | Purpose | Important states |
| --- | --- | --- |
| `/manage` | Queue Master dashboard | Live, check-in open, empty, loading, error |
| `/manage/sessions` | Session list with segmented filters | Upcoming/live/past, empty |
| `/manage/sessions/new` | Four-step session wizard | Validation, narrow step rail, long club names |
| `/manage/sessions/[sessionId]` | Live board: courts, matches, rotation preview, waiting queue | Live, no live data, preview, stale/expired preview, rotation commit, completion |
| `/manage/sessions/[sessionId]/check-in` | Participants, approval, guests, QR | All/pending/ready/in tabs, guest dialog, edit/remove dialogs |
| `/manage/sessions/[sessionId]/settings` | Session policy/configuration | Validation, disabled |
| `/manage/live` | Live-court overview | Empty/live |
| `/manage/matches` | Match list | Empty/live |
| `/manage/matches/[matchId]` | Scoring | Ready/in-progress/completed, confirmation, undo |
| `/manage/clubs/[clubId]` | Club overview/tools | Live/upcoming/empty |
| `/manage/clubs/[clubId]/members` | Members, invitations, roles | Pending/active/suspended, invite result |
| `/manage/clubs/[clubId]/courts` | Court CRUD/status | Rows, empty |
| `/manage/clubs/[clubId]/settings` | Club policy | Validation |
| `/manage/clubs/[clubId]/audit` | Audit history | Empty/paged |
| `/manage/more` | Account/club/install tools | Empty clubs |

### Super-admin shell (`/admin`)

| Route | Purpose |
| --- | --- |
| `/admin` | Registration approval queue |
| `/admin/registrations`, `/admin/registrations/[id]` | Registration review |
| `/admin/users`, `/admin/users/new`, `/admin/users/[id]`, `/admin/users/[id]/edit` | User administration |
| `/admin/audit-logs` | Administrative audit trail |
| `/admin/settings` | Platform settings |

## 3. Roles and permission-dependent UI

| Role | Enforcement |
| --- | --- |
| Guest | Public session/club pages, scoreboard, auth pages, check-in token |
| `PLAYER` | `/app/*`; club membership required for club pages; no Queue Master controls |
| `QUEUE_MASTER` | `/manage/*` for owned/admin clubs; check-in, rotation, scoring; member/role controls limited |
| `OWNER` | Full club administration, role changes, invitations, settings, archive/transfer |
| `SUPER_ADMIN` | `/admin/*`, user and registration administration, audit logs |
| Token holder | `/check-in/[token]` without account |

Permission-dependent UI was reviewed through the `viewerRole`/`isOwner` branches on club pages, the check-in guest controls, and the session state machine (draft → scheduled → check-in → live → completed/cancelled).

## 4. Shared component families

| Family | Files | Shared by |
| --- | --- | --- |
| Shell/navigation | `components/layout/app-shell.tsx`, `components/public/public-shell.tsx`, `components/admin/admin-shell.tsx` | All authenticated and public pages |
| Page/typography | `components/ui/page.tsx` (`PageHeader`, `SectionHeading`, `StatCard`) | Every dashboard/list |
| Card | `components/ui/card.tsx` | Dashboards, lists, dialogs, live board |
| Actions | `components/ui/button.tsx`, `badge.tsx`, `segmented.tsx` | All pages |
| Forms | `components/ui/input.tsx` (`Input`, `Select`, `Textarea`, `Label`, `Field`) | Auth, wizard, settings, guests |
| Feedback | `components/ui/feedback.tsx` (`Skeleton`, `PageSkeleton`, `EmptyState`, `ErrorState`) | Every data surface |
| Session | `components/session/session-card.tsx`, `status.tsx` | Player and manage lists |
| Match/scoring | `components/match/score-card.tsx` | Player matches, live board, public results |
| Public | `components/public/public-session-view.tsx`, `public-match-card.tsx`, `public-scoreboard-view.tsx` | Public session/scoreboard |
| Queue Master | `components/manage/session-wizard.tsx`, `club-admin-nav.tsx` | Session creation and club admin |

These families are the root-cause layer: padding, heading gaps, mobile touch sizing, and overflow containment were corrected there before page-specific patches.

## 5. Spacing and theme infrastructure

- Tailwind 4's default spacing scale is already the token system: `1 = 4px`, `2 = 8px`, `3 = 12px`, `4 = 16px`, `5 = 20px`, `6 = 24px`, `8 = 32px`, `10 = 40px`, `12 = 48px`.
- Semantic colour tokens are CSS variables (`--background`, `--card`, `--primary`, `--lime`, `--forest`, etc.) exposed through `@theme inline`.
- Radius tokens derive from `--radius` (16px): `sm 8`, `md 12`, `lg 16`, `xl 22`, `2xl 30`.
- Shadows: `shadow-soft`, `shadow-lift`.
- No dark-mode palette is implemented.
- Component data attributes were added for the audit (`data-ui="card"`, `card-content`, `page-title`, `section-heading`, `stat-card`, `segmented`, `field`) so semantic rules can assert relationships without coupling to Tailwind class strings.

## 6. Responsive breakpoints

| Breakpoint | Width | Behaviour |
| --- | --- | --- |
| default | <640 | Single-column; mobile header and five-item bottom navigation |
| `sm` | 640 | Two-column cards/forms; larger card padding 24px |
| `md` | 768 | Wider content; still bottom navigation |
| `lg` | 1024 | Sidebar appears (280px); session board and check-in adopt two-column cockpit |
| `xl` | 1280 | Player/QM dashboards adopt two-column main/aside; wider grids |
| `2xl` | 1536 | Content capped at 86rem |

The audit also exercises `max-sm` behaviour at 320/360/375/390/430 and widths immediately around 640/768/1024/1280.

## 7. Existing automated coverage

| Layer | Command | Coverage |
| --- | --- | --- |
| Backend unit | `pnpm test` | Contracts, matchmaking, scoring, API units |
| Backend integration | `pnpm test:integration` | Disposable MongoDB, API workflows |
| Cross-app E2E | `pnpm test:e2e` | Auth, player queue, QM live/scoring, public PWA, accessibility, admin |
| UI audit capture | `pnpm audit:ui` | 172 screen states, 301 screenshots, axe, performance, keyboard |
| Visual baselines | `pnpm --dir tests/e2e exec playwright test -c playwright.visual.config.ts` | Sign-in at 320/390/744/1180, offline at 390 |
| New spacing gate | `pnpm audit:spacing` / `pnpm audit:spacing:full` | Overflow, clipping, overlap, semantic gaps, card padding, target size |
| Frontend repo gates | `pnpm lint`, `pnpm typecheck`, `pnpm build` | Includes new UTF-8 encoding guard |

The frontend repo itself does not own Playwright; cross-app browser coverage lives in the umbrella harness so there is one browser-testing stack. The audit docs live in the umbrella because it is the only checkout where both apps and the harness are available.

## 8. Known visual inconsistencies at audit start

Inherited from the 2026-10-25 audit and re-verified on 2026-10-26:

1. Mojibake and UTF-8 BOM characters in 26 frontend files.
2. Player home overflowed to 325px at a 320px viewport (two-button row).
3. QM dashboard overflowed to 343px at 320 (three-column live stat row).
4. QM check-in document was 405px wide at 390/320; the four-tab strip set the min-content width.
5. Session wizard was 445px wide at every phone width; the step rail set the grid min-content width.
6. Public header was 370px at 320; the marketing CTA did not wrap or hide.
7. Member and “more” rows clipped names/emails in narrow cards.
8. Section descriptions sat 2px under section headings.
9. Public scoreboard used 9–10px metadata and 40% white text.
10. Session/team names were blindly truncated with no reveal, including in the 1024px two-column board.

## 9. High-risk components

| Component | Risk |
| --- | --- |
| `AppShell` | Sidebar/bottom-nav duplication, fixed chrome, avatar hit area |
| `PageHeader` / `SectionHeading` | Heading/description gaps repeated on every page |
| `Card` / `CardContent` | Padding contract used by ~40 screens |
| `Segmented` | Intrinsic min-width; primary cause of phone overflow |
| `SessionCard` / `UpcomingSessionCard` | Long names, narrow two-column contexts |
| Check-in participant row | Dense actions beside long names/emails |
| Session wizard step rail | Four labels wider than 320/390 viewports |
| Public shell header/footer | Marketing CTA competes with sign-in at 320 |
| Public scoreboard | Small type, contrast, long team names |
| Rotation preview / next rotation | Dense controls in the tablet right rail |

## 10. State coverage used in this pass

| State | Player surfaces | QM surfaces | Public surfaces |
| --- | --- | --- | --- |
| Normal populated | Yes | Yes | Yes |
| Empty | Yes (no clubs/sessions/history) | Yes (no sessions/participants/courts) | Yes (open courts) |
| Loading/skeleton | Yes (`PageSkeleton`, card skeletons) | Yes | Partial (live socket status) |
| Error | Yes (`ErrorState`) | Yes | Offline fallback |
| Validation error | Auth/forms | Wizard, settings, guests | Check-in token |
| Disabled | Pause/register states | Status transitions, busy states | n/a |
| Long text | Session/club/player names | Session/club/team names, emails | Team names, club names |
| Dense data | Full queue, match history | 13 participants, 4 courts, rotation | 4 courts, completed results |
| Modal/drawer | Confirmations | Guest add/edit, remove, rotate, swap, complete, cancel | n/a |
| Toast | Join/leave errors | All mutations | n/a |
| Permission-restricted | Player-only | Owner vs Queue Master branches | n/a |
| Live update | Queue/score socket updates | Board/score/rotation updates | Scoreboard socket updates |

Some states cannot be produced against the demo seed without mutating business data (e.g. a failed socket recovery). Those are listed as deferred in `findings.md` with the remaining risk.
