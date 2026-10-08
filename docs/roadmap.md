# ToolForge OS roadmap

## Phase A — evidence and contracts (implemented)
- Source/product reconstruction
- Feedback capture
- Canonical ToolDefinition contract
- Privacy and input/output type contracts
- Duplicate-alias invariant

## Phase B — working vertical slice (implemented)
- Search and filters
- 14 executable browser tools
- Bookmarks and recents
- Tool workbench
- Output chaining
- Responsive UI
- Unit tests + typecheck + production build

## Phase C — catalog scale
- Split registry into signed tool packs
- Generate static discovery pages from canonical metadata
- Add synonym dictionaries and typo-tolerant indexing
- Add health receipts per tool implementation
- Add import/export of workspace recipes

## Phase D — execution runtime
- Sandboxed Web Workers for CPU-heavy transforms
- WASM adapters for image/PDF/audio tools
- Explicit server execution gateway only for tools that cannot be local
- Per-tool privacy manifest before input is accepted

## Phase E — workflow OS
- Visual DAG/recipe composer
- Batch input fan-out and zip collection
- Typed compatibility graph
- Saved recipes and deterministic replay receipts
- Optional AI planner that only selects verified tools; execution remains typed and bounded

## Phase F — scale and launch
- SEO pages from the canonical registry (never aliases)
- Usage analytics that avoid content capture
- Accessibility/performance budgets
- Preview → test → production promotion gate
