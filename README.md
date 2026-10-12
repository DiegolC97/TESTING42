# testing42

A small, predictable web app for testing the platform. Built with
[Next.js](https://nextjs.org) (App Router), TypeScript and Tailwind CSS.

## Pages

| Route      | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
| `/`        | Landing page: a hero section with a call-to-action button.         |
| `/counter` | Counter page. Not built yet, so Next.js shows its not-found page.  |

## Prerequisites

- Node.js 20 or newer (developed with Node 24)
- npm (bundled with Node.js)

## Install

```bash
npm install
```

## Run in development

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The page reloads
automatically when you edit files under `src/`.

## Build for production

```bash
npm run build
npm run start
```

`npm run build` creates the optimized production build and `npm run start`
serves it on [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript (tsc --noEmit)
npm run build      # production build, also type-checks
```

All three must finish with zero errors.

## Project layout

```
src/app/
  layout.tsx    # root layout and site metadata
  page.tsx      # landing page (/)
  globals.css   # Tailwind import and theme tokens
```
