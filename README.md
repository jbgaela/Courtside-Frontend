# PickleQueue Web

Next.js 16 App Router PWA for PickleQueue: player queue, Queue Master live board,
rally scoring, public scoreboard and offline fallback.

This repository is **self-contained**. The wire contract package it consumes
(`@picklequeue/contracts`) is vendored under `packages/contracts` and built from
this checkout. It does not require the Backend repository or an umbrella
workspace to install, test, build or deploy.

## Requirements

- Node.js 22 LTS (minimum 20.9)
- pnpm 10.17 (`corepack enable`)
- A running PickleQueue API for live data (`NEXT_PUBLIC_API_URL`)

## Quick start

```bash
git clone https://github.com/jbgaela/Courtside-Frontend.git
cd Courtside-Frontend
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

The web app reads `.env.local`. `pnpm dev` and `pnpm build` build
`packages/contracts` first, so no separate workspace step is needed.

The API is a separate deployment. Point `NEXT_PUBLIC_API_URL` (browser) and
`API_INTERNAL_URL` (server-side) at it. For the full stack locally, run the API
repository on `http://localhost:4000`.

## Verification

```bash
pnpm typegen
pnpm typecheck
pnpm lint
pnpm test        # contracts package tests
pnpm build
pnpm format:check
```

## Layout

```text
src/app/                App Router routes and layouts
src/components/         UI, auth, queue master and scoreboard components
src/lib/                API client, auth context, types, query hooks
src/hooks/              Shared client hooks
public/                 PWA manifest, service worker, icons
packages/contracts/     Vendored wire types, enums and config schemas
```

The contract package is a pnpm workspace member (see `pnpm-workspace.yaml`).
Run `pnpm build:packages` after editing it.

## Demo accounts

Against the seeded development API. Password: `PickleQueue123!`

- `owner@picklequeue.dev` â€” Queue Master console
- `alex@picklequeue.dev` â€” player
- `zoe@picklequeue.dev` â€” player
- `jordan@picklequeue.dev` â€” Queue Master

## Deployment

Install and build with the repository scripts:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

`pnpm install` builds `packages/contracts` through `postinstall`, so a platform
that invokes `next build` directly also works. Build-time public variables
(`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`) must be present during the build;
`API_INTERNAL_URL` is used by server-side requests.

