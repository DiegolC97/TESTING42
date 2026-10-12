# gotcha

A non-obvious pitfall or trap, learned the hard way.

## `next dev` rewrites `AGENTS.md`

**What:** Next.js 16 appends a `<!-- BEGIN:nextjs-agent-rules -->` block to `AGENTS.md` every time `next dev` runs. The block is committed alongside the chiron-memory block so the tree stays clean.

**Why:** Deleting the block only recreates an uncommitted change on the next dev run. Keep both blocks; do not reorder or strip them.

**Where:** `AGENTS.md`; generator at `node_modules/next/dist/server/lib/generate-agent-files.js`.

**Learned:** 2026-10-12, landing page Work Order.

## `create-next-app` refuses a non-empty directory

**What:** The scaffolder aborts when the target contains `README.md`, `AGENTS.md`, `CLAUDE.md`, `.chiron/` or `chiron-memory/`. Scaffold into a temp directory and copy the generated files in.

**Why:** Chiron-managed projects always have these files before the app exists.

**Where:** Project root.

**Learned:** 2026-10-12, landing page Work Order.

## `npm audit` reports `braces` via `eslint-config-next`

**What:** `npm install` reports 5 high-severity advisories, all the same `braces` stack-exhaustion issue reached through `eslint-config-next` → `fast-glob` → `micromatch`. It is dev-only and the only "fix" npm offers downgrades to `eslint-config-next@14`, which breaks Next 16.

**Why:** Do not run `npm audit fix --force`. Wait for an upstream `eslint-config-next` release.

**Where:** `package-lock.json`.

**Learned:** 2026-10-12, landing page Work Order.
