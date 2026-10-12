<!-- chiron-memory:start -->
# Project memory (chiron-memory)

This project uses chiron-memory: `chiron-memory/` holds atomic knowledge items
(decisions, conventions, gotchas) that future sessions retrieve. The
`chiron-memory` skill defines the format.

- **Before working**: search the project memory — it may already have the
  answer. Use the memory MCP tools when available (`memory_search`,
  `memory_canonical`), else `chiron-memory search "<topic>"`. Always do
  this, even when the task seems obvious.
- **When you learn something** (a decision with its why, a gotcha, a
  convention): record it in its type's file under `chiron-memory/` right then,
  in the What · Why · Where · Learned format. Don't leave it for the end.
- **Before finishing**: if you touched behavior/architecture and recorded
  nothing, record what you learned. Validate with `chiron-memory check`
  when that CLI is installed.
- Never use `chiron-memory/` as a journal or changelog — durable, reusable
  knowledge only.
<!-- chiron-memory:end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
