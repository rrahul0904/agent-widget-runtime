# ToolForge OS roadmap

## Phase A — evidence and contracts — COMPLETE
- Source/product reconstruction
- Feedback capture
- Canonical `ToolDefinition` contract
- Privacy and input/output type contracts
- Duplicate-alias invariant
- REA evidence matrix with MATCH / IMPROVE / NEW / OMIT / INVESTIGATE classifications

## Phase B — working vertical slice — COMPLETE
- Search and filters
- Bookmarks and recents
- Tool workbench
- Output chaining
- Responsive UI
- Unit tests + typecheck + production build

## Phase C — catalog scale — CURRENT WAVE COMPLETE
- Expanded from 14 to 59 canonical tools without duplicate SEO aliases
- Added PDF/Office, Image, Network, Security, Media and Utility categories
- Added file contracts (`file` / `files`, MIME accept rules, downloadable artifacts)
- Added explicit `local`, `network-assisted` and reserved `account-sync` execution classes
- Added task-language search coverage across the expanded catalog
- Added registry tests that enforce 46+ real canonical capabilities and zero duplicate identities

Remaining Phase C enhancements:
- Split the registry into signed capability packs as the catalog grows further
- Generate canonical static discovery pages from registry metadata
- Add typo-tolerant indexing and synonym dictionaries
- Add per-tool health receipts and fixture catalogs
- Add import/export of workspace recipes

## Phase D — execution runtime — CURRENT WAVE COMPLETE FOR SHIPPED TOOLS
- Local image transforms use browser Canvas/Image APIs
- Local audio inspection/waveforms use Web Audio
- Local PDF merge/split/rotate/image packaging uses pinned `pdf-lib`
- Local file checksum/signature inspection uses Web Crypto and byte signatures
- Network-assisted utilities require explicit execution and pre-run disclosure
- File/heavy tools do not auto-run
- Installable PWA manifest and same-origin runtime caching added

Phase D parity investigations — NOT CLAIMED COMPLETE:
- High-fidelity PPTX→PDF renderer
- OCR table reconstruction suitable for spreadsheet export
- AI background-removal runtime/model packaging
- High-fidelity Excel↔PDF conversion
- PDF rasterization/compression acceptance corpus

These remain `INVESTIGATE` until deterministic fixtures, browser/runtime verification and performance budgets exist. ToolForge will not mark them complete simply to match another product’s catalog labels.

## Phase E — workflow OS — NEXT
- Visual DAG/recipe composer
- Batch input fan-out and zip collection
- Typed compatibility graph beyond text/json chaining
- Saved recipes and deterministic replay receipts
- Optional AI planner that only selects verified tools; execution remains typed and bounded

## Phase F — launch and monetization — ACTIVE
- Canonical SEO/discovery pages only; never alias-page spam
- Privacy-preserving usage analytics that never capture tool input contents
- Accessibility/performance budgets
- Preview → verify → production promotion gate
- Free core tools; monetize advanced workflow, batch, recipe-sync and team capabilities rather than basic converters
- No deceptive download buttons or ad placement inside workbench actions

## Release gate

A release is production-ready only when all are true:

1. Registry validation is green.
2. TypeScript, unit tests and production build are green for the exact commit.
3. Vercel preview is READY for that exact commit.
4. Runtime smoke checks pass for representative local, file/PDF and network-assisted paths.
5. Production deployment points to the verified SHA.
6. Documentation lists unresolved parity items as `INVESTIGATE` rather than implying completion.
