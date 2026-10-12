# decision

A choice made and the reasoning behind it — the path taken over the alternatives.

## Stack: Next.js 16 App Router + TypeScript + Tailwind 4, npm, `src/` dir

**What:** The app is scaffolded with `create-next-app` (Next.js 16.4, React 19.3, Tailwind 4 via `@tailwindcss/turbopack`, ESLint 9 flat config), uses the App Router under `src/app/`, the `@/*` import alias, and npm with a committed `package-lock.json`.

**Why:** The Work Order asked for Next.js + TypeScript + Tailwind with the App Router and the smallest predictable setup. The official scaffold gives a known-good config; `src/` keeps app code separate from root config and Chiron files. npm was chosen because it ships with Node and needs no extra install.

**Where:** `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `src/app/`.

**Learned:** 2026-10-12, landing page Work Order.

## No Google Fonts: system font stack instead of `next/font/google`

**What:** The scaffold's Geist font loading via `next/font/google` was removed. `body` uses Tailwind's `font-sans` (system stack) and `globals.css` no longer defines `--font-sans` / `--font-mono`.

**Why:** `next/font/google` downloads font files at build time, so builds fail without network access. A test app for the platform should build offline and deterministically.

**Where:** `src/app/layout.tsx`, `src/app/globals.css`.

**Learned:** 2026-10-12, landing page Work Order.

## `/counter` is linked before it exists

**What:** The landing page call-to-action links to `/counter`, which returns Next.js's default not-found page until the counter Work Order lands.

**Why:** The two pages are separate Work Orders. The 404 is the agreed interim behavior, not a bug.

**Where:** `src/app/page.tsx` (`<Link href="/counter">`).

**Learned:** 2026-10-12, landing page Work Order.

## Computer move is delayed 400 ms and guarded against double moves

**What:** In `ConnectFour.tsx` a `useEffect` schedules the computer's move with `setTimeout(…, 400)` whenever it is the computer's turn and the game is still running. The cleanup clears the timer, and the state updater only applies the move when `current.board === board` (the board the move was computed for).

**Why:** The Work Order requires a visible "computer's turn" during which player clicks are ignored, and that the computer never moves twice. The delay makes the turn visible; the board identity check plus cleanup makes a double move impossible even under React Strict Mode's double effect invocation or a "New game" click mid-think.

**Where:** `src/app/connect-four/ConnectFour.tsx` (`COMPUTER_DELAY_MS`).

**Learned:** 2026-10-12, Connect Four Work Order.

## Computer randomness is injectable

**What:** `chooseComputerColumn(board, random = Math.random)` takes the random source as a parameter.

**Why:** Rules 3 and 4 (random centre / random valid column) can then be checked deterministically by passing a fixed function, which is how the rule order was verified.

**Where:** `src/lib/connect-four.ts`.

**Learned:** 2026-10-12, Connect Four Work Order.
