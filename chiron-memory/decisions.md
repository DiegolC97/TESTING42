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

## Hard Connect Four opponent: alpha-beta search in a Web Worker with a safety-belt win/block check

**What:** `chooseHardColumn` (`src/lib/connect-four-hard.ts`) first applies the explicit win-now / block-now rules via `findWinningColumn`, then runs negamax + alpha-beta with iterative deepening under a 700 ms budget (`DEFAULT_TIME_BUDGET_MS`), returning the move from the last fully completed depth. The page runs it in a Web Worker (`src/lib/connect-four-hard.worker.ts`, created with `new Worker(new URL("../../lib/connect-four-hard.worker.ts", import.meta.url))`) and starts the search as soon as it is the computer's turn, applying the reply only after the 400 ms visible delay has also passed. Replies carry a request id and are applied only if `current.board` is still the board they were computed for.

**Why:** The Work Order demands Hard never misses an immediate win or block (the explicit pre-check makes that provable regardless of search depth), answers within about 1 s, and keeps the page responsive. Searching on the main thread would block it for up to the whole budget; in the worker the main thread's longest stall measured 21 ms. Easy/Medium stay synchronous inside the existing `setTimeout`. If `Worker` is undefined, Hard falls back to a synchronous 300 ms search.

**Where:** `src/lib/connect-four-hard.ts`, `src/lib/connect-four-hard.worker.ts`, `src/app/connect-four/ConnectFour.tsx`.

**Learned:** 2026-11-18, difficulty levels Work Order.

## Connect Four settings live in React state only; opening the setup step clears the board

**What:** `ConnectFour.tsx` keeps `settings` (the match in progress) separate from `draft` (what the setup step shows); `draft` is copied into `settings` only on "Start game". Opening the setup step (Restart confirmation, or "New game" after a result) discards the game and renders an empty, inert board. Nothing is written to storage, so a reload always shows Medium / Player first.

**Why:** The Work Order requires defaults on every page load, the last-used settings preselected after a game, and "Cancel" on the restart prompt to leave the match untouched. Keeping the draft separate makes Cancel trivially safe.

**Where:** `src/app/connect-four/ConnectFour.tsx` (`DEFAULT_SETTINGS`, `openSetup`, `startGame`).

**Learned:** 2026-11-18, difficulty levels Work Order.
