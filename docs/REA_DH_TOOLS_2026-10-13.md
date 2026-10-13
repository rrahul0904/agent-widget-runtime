# REA Reconstruction Receipt — DH Tools pattern

Date: 2026-10-13
Source request: Reddit share `r/prettyusefulwebsites/s/P2ba0iAIBF`
Public product resolved during investigation: DH Tools / DenizliHub
Owned implementation: ToolForge OS (`rrahul0904/agent-widget-runtime`)

## 1. Understanding

The reference is a broad browser-utility suite whose public product surface combines PDF/Office, image/OCR, developer/code, network/IP, text and general utilities in one searchable interface. Its differentiation centers on privacy, browser-side execution, no-registration core use and PWA-style access.

The reconstruction opportunity is stronger than a feature-for-feature clone: make the execution boundary itself a first-class product contract, preserve canonical search and composability, and refuse unsupported fidelity claims.

## 2. Evidence-derived requirements

- One searchable catalog rather than separate utility microsites.
- 46+ useful capabilities without duplicate synonym pages.
- Local execution for transforms that the browser can perform reliably.
- Explicit disclosure for network-dependent tasks.
- No silent DNS/IP/HTTP requests.
- No account requirement for core utilities.
- Favorites/recents and installable/offline shell.
- File utilities return downloadable artifacts.
- Verification must fail on duplicate IDs/aliases or privacy-contract regressions.

## 3. Reconstruction result

Current ToolForge v0.2 contains 59 canonical tools. The implementation expands the existing 14-tool donor rather than creating a second overlapping product.

Shipped execution families:

- Text/data/developer/security transforms
- Math/date/color utilities
- Image decode/convert/resize/rotate/filter/SVG rasterization/code-card generation
- File checksum and signature inspection
- PDF merge/page extraction/rotation/images→PDF/metadata inspection
- Audio metadata inspection and waveform rendering
- Explicit network-assisted DNS, public-IP and HTTP-header probes
- PWA manifest and same-origin offline runtime cache

## 4. Improvement decisions

- Replace blanket privacy marketing with per-tool execution classes.
- Preserve one canonical tool per capability and let aliases affect search only.
- Require explicit Run for file/heavy and network-assisted operations.
- Keep network-assisted utilities visually distinct in cards and the workbench.
- Keep file transforms local and expose generated files as typed artifacts.
- Maintain typed output chaining for compatible text/data operations.

## 5. Intentional unknowns / investigations

The following are not accepted as complete merely because a reference product lists them:

- High-fidelity PPTX→PDF
- OCR table reconstruction suitable for spreadsheet export
- AI background removal with a pinned offline-capable model/runtime
- High-fidelity Excel↔PDF conversion
- PDF rasterization/compression parity across representative fixture corpora

They remain `INVESTIGATE` until implementation, deterministic fixtures, browser tests and quality/performance budgets prove them.

## 6. Verification contract

Release gate for this wave:

- registry contains at least 46 unique canonical tools;
- no duplicate IDs or aliases;
- representative task-language searches resolve correctly;
- all network-assisted tools are `autoRun: false` and contain a disclosure;
- all current file-input tools are local;
- `npm run verify` passes at the exact release SHA;
- Vercel preview reaches READY at that exact SHA;
- production is promoted only from the verified implementation.

## 7. Status semantics

This receipt distinguishes two meanings of “complete”:

1. **ToolForge v0.2 product wave** — complete when the release gate above passes and production points to the verified SHA.
2. **Exact parity with every named reference utility** — not claimed; the five fidelity-heavy areas above remain `INVESTIGATE` by design.

This prevents a tracker or release note from converting unknown fidelity into a false completion claim.
