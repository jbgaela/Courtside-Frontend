# PickleQueue Web

Next.js 16 App Router PWA for PickleQueue: player queue, Queue Master live board,
rally scoring, public scoreboard and offline fallback.

This repository is the **frontend application** of the PickleQueue workspace. The
workspace root also contains shared packages (`contracts`, `matchmaking`,
`scoring`), end-to-end tests and documentation. Those shared packages are not
inside this repository; use the workspace root as the unit of checkout.

## Quick start

From the PickleQueue workspace root:

```bash
pnpm install
pnpm build:packages
pnpm db:up
pnpm db:push
pnpm db:seed
pnpm dev:web
```

Web: `http://localhost:3000`  
Public demo: `http://localhost:3000/public/sessions/s_riverside_saturday`

## Build and verify

```bash
pnpm --filter @picklequeue/web typecheck
pnpm --filter @picklequeue/web lint
pnpm --filter @picklequeue/web build
pnpm test:e2e
```

The E2E harness builds this app in production mode, starts the API and web app,
and uses its own disposable MongoDB replica-set container. The container is
removed after the run.

## Demo accounts

Password: `PickleQueue123!`

- `owner@picklequeue.dev` — Queue Master console
- `alex@picklequeue.dev` — player
- `zoe@picklequeue.dev` — player
- `jordan@picklequeue.dev` — Queue Master

## Documentation

The full architecture, ADRs, API contract, testing evidence, operations and
deployment runbooks live in the workspace root under `docs/`.
