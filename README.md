# ToolForge OS

ToolForge OS is an original, registry-driven browser utility workspace inspired by the observable product pattern behind Utily, then redesigned around canonical tools, composable outputs, and explicit privacy contracts.

## Implemented vertical slice

- 14 working browser-local tools across data, developer, text, date/time, color, regex, conversion, and diff tasks
- Canonical tool registry with aliases instead of duplicate SEO pages
- Intent-weighted search (`csv to json`, `hash text`, `meters to feet`, etc.)
- In-place workbench with tool options, samples, output metadata, and copy
- Output chaining into compatible next tools
- Bookmarks and recents persisted locally
- Browser-only execution badge backed by per-tool privacy metadata
- Keyboard-first search (`/` or `Cmd/Ctrl+K`)
- Responsive dark UI
- Registry integrity checks and unit tests
- CI verification workflow

## Why this differs from a 7,000-page toolbox

Scale is generated from a governed capability registry, not synonym pages. `JSON prettify`, `JSON formatter`, `JSON beautifier`, and `JSON minifier` resolve to one JSON Workbench, which removes duplicate results while preserving discoverability.

The next scale step is capability-first: more tested executors, typed workflow edges, sandboxed file workers, batch jobs, and canonical SSR discovery pages only after behavior is verified.

## Local run

```bash
npm install
npm run dev
```

## Verification

```bash
npm run verify
```

`verify` runs TypeScript checks, unit tests, and the production Vite build.

See `docs/reverse-engineering.md` for evidence → product decisions and `docs/roadmap.md` for the phased build plan.
