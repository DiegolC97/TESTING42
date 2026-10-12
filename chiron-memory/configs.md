# config

Setup and configuration — env vars, flags, how to run the project.

## Quality gates: build, lint, typecheck

**What:** `npm run build` (production build, includes a TypeScript pass), `npm run lint` (ESLint 9 flat config, runs `eslint` with no args) and `npm run typecheck` (`tsc --noEmit`) must all exit 0. Dev server: `npm run dev` on port 3000.

**Why:** The Work Orders require zero errors from all three before a page is done; `typecheck` was added as a named script so the TS check is explicit and CI-friendly.

**Where:** `package.json` scripts; `README.md` "Quality checks".

**Learned:** 2026-10-12, landing page Work Order.
