# convention

A rule the codebase follows — naming, patterns, and where things live.

## Game rules live in `src/lib/`, pages are thin client components

**What:** Rule logic (board, drops, win/draw detection, computer move) is a framework-free module in `src/lib/connect-four.ts`. The route file `src/app/connect-four/page.tsx` is a server component that only sets metadata and renders the `"use client"` component `ConnectFour.tsx`, which holds React state and calls the pure functions.

**Why:** The Work Order asks for rules that can be checked by hand. A pure module can be run directly with `node src/lib/<file>.ts` (Node 24 strips types natively) without a browser or test runner, and the client boundary stays as small as possible so the rest of the page is prerendered.

**Where:** `src/lib/connect-four.ts`, `src/app/connect-four/`.

**Learned:** 2026-10-12, Connect Four Work Order.

## Shared button classes in `src/components/button-styles.ts`

**What:** `primaryButtonClass` and `secondaryButtonClass` hold the Tailwind classes for the pill buttons used on every page. New pages import them instead of copying class strings.

**Why:** The Work Orders require every page to inherit the landing page's look. One source of truth stops the styles drifting.

**Where:** `src/components/button-styles.ts`, used by `src/app/page.tsx` and `src/app/connect-four/ConnectFour.tsx`.

**Learned:** 2026-10-12, Connect Four Work Order.
