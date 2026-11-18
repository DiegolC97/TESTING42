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

## Playwright waits on `aria-disabled="true"` instead of clicking

**What:** Playwright's `page.click` / `locator.click` treats `aria-disabled="true"` as "not enabled" and silently waits (up to the timeout) for the element to become enabled before dispatching the click.

**Why:** The board columns carry `aria-disabled` while it is the computer's turn, when they are full and after the game ends. Tests that want to prove such clicks are *ignored* must bypass actionability, e.g. `page.evaluate(() => el.click())` or `click({ force: true })`; otherwise the click lands after the state changes and looks like a bug in the page.

**Where:** `src/app/connect-four/ConnectFour.tsx` (column buttons); any Playwright driving of `/connect-four`.

**Learned:** 2026-10-12, Connect Four Work Order.

## Drive the dev server through `localhost`, not `127.0.0.1`

**What:** With `next dev`, loading the page via `http://127.0.0.1:<port>` renders the HTML but React never hydrates: Next blocks the dev resources as cross-origin (the server log says "Blocked cross-origin request to Next.js dev resource", the browser shows HMR WebSocket errors) and every click is silently ignored. Use `http://localhost:<port>` (or add `allowedDevOrigins` in `next.config.ts`).

**Why:** Browser automation against the dev server looks like a broken page (buttons do nothing) when it is only the origin.

**Where:** Any Playwright / browser run against `npm run dev`.

**Learned:** 2026-11-18, difficulty levels Work Order.

## Running `src/lib` modules with bare `node` has two constraints

**What:** Node 24's type stripping rejects TypeScript parameter properties (`constructor(private x: T)`), and ESM resolution needs an explicit `.ts` extension on relative imports. The lib modules use plain fields instead of parameter properties, and because the Next/TS config uses extensionless imports, a cross-module hand-check script must first copy the files to a scratch directory and rewrite `from "./x"` to `from "./x.ts"` (one `sed`).

**Why:** Keeps the "rules can be checked with bare `node`" convention working now that `connect-four-hard.ts` imports `connect-four.ts`.

**Where:** `src/lib/connect-four.ts`, `src/lib/connect-four-hard.ts`.

**Learned:** 2026-11-18, difficulty levels Work Order.
