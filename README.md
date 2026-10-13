# ToolForge OS

ToolForge OS is a clean-room, local-first Utility OS built around canonical tools, composable outputs, explicit execution/privacy contracts, and verified expansion instead of duplicate toolbox pages.

## Current implementation

- 59 canonical tools across Data, Text, Developer, Date & Time, Color, Math, PDF & Office, Image, Security, Media, Network and Utility categories
- Intent-weighted search (`csv to json`, `merge pdfs`, `jwt decode`, `resize picture`, `dns lookup`, etc.)
- Canonical registry with aliases instead of duplicate SEO pages
- In-place workbench with options, samples, output metadata and copy
- Downloadable browser-generated file artifacts
- Typed output chaining for compatible text/data tools
- Bookmarks and recents persisted locally
- Explicit execution classes: `local`, `network-assisted`, reserved `account-sync`
- Network tools disclose the external request and never execute silently
- File/heavy tools require explicit execution rather than auto-running on selection
- Browser-local PDF merge/split/rotate/images→PDF via pinned `pdf-lib`
- Browser-local image format conversion, resize, rotation, filters, SVG rasterization and code-card rendering via Canvas
- Browser-local file checksums/signature inspection via Web Crypto and byte signatures
- Browser-local audio inspection and waveform rendering via Web Audio
- Installable PWA metadata plus same-origin offline runtime caching
- Responsive dark UI and keyboard-first search (`/` or `Cmd/Ctrl+K`)
- Registry integrity tests, execution-contract tests, TypeScript verification and production build gates

## Privacy model

ToolForge does not use one blanket “everything is 100% local” statement.

- **Local** — the tool executes inside the browser runtime and ToolForge does not upload that input.
- **Network-assisted** — the task inherently contacts an external endpoint (for example DNS or public-IP lookup); the tool is labeled, explains the request, and runs only after an explicit button press.
- **Account-sync** — reserved for future optional recipe/settings synchronization and never required for core utilities.

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

## Product direction

ToolForge is not trying to win by generating thousands of thin pages. Expansion is capability-first: a tool enters the registry only when it has a real executor, an execution/privacy contract, searchable metadata and a verification path.

The next product layer is Workflow OS: capability packs, typed recipes/DAGs, batch fan-out, deterministic replay receipts, optional recipe sync and a bounded AI planner that may select only verified tools.

See `docs/reverse-engineering.md` for the REA evidence → product decisions and `docs/roadmap.md` for release gates and remaining investigations.
