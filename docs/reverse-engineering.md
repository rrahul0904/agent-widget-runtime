# Clean-room reverse engineering notes

## Product lineage

ToolForge OS is a clean-room implementation of the browser-utility workspace pattern. Earlier evidence came from Utily. The October 2026 expansion adds a second public reference product: DH Tools / DenizliHub, a privacy-first utility suite publicly advertising 46+ PDF, image, OCR, developer, network, text and utility tools.

No reference source code, protected assets, branding, private APIs, or database implementation is copied. Observable behavior and public product claims are treated as evidence; ToolForge owns its registry, execution contracts, UI, tests, architecture and implementation.

## REA evidence → reconstruction model

### Observable reference capabilities

Public product behavior shows a single searchable catalog with favorites, broad categories and utilities spanning PDF/Office, image/OCR, developer/code, network/IP, text and general utilities. The product also advertises PWA/offline behavior and browser-side processing for many tools.

The reference additionally includes tools such as DNS and public-IP lookup that necessarily require network communication. That creates an important product-contract distinction: a suite can be local-first without every tool being network-free.

### Public feedback converted into requirements

- Search/navigation is the dominant UX risk once the catalog becomes large.
- Duplicate aliases must collapse into one canonical result instead of generating many near-identical pages.
- A commodity toolbox needs meaningful differentiation beyond raw tool count.
- Privacy language must describe actual execution behavior rather than applying one blanket promise to every utility.
- File-processing utilities need explicit, testable local execution boundaries.
- Network tools must never execute silently and must disclose the external request before it runs.
- SEO scale is acceptable only for canonical, tested capabilities rather than synonym-page inflation.

## Feature classification

| Capability | REA class | ToolForge decision |
| --- | --- | --- |
| Search, categories, favorites, recents | MATCH | Keep; task-weighted search remains canonical. |
| 46+ useful utilities | IMPROVE | Ship 59 canonical tools without duplicate alias pages. |
| Client-side text/dev/data tools | MATCH | Keep browser-only execution. |
| PDF merge/split/rotate/images→PDF | MATCH | Implement locally with `pdf-lib`. |
| Image conversion/resize/rotate/filters/SVG→PNG | MATCH | Implement locally with Canvas and browser decoders. |
| File checksum/signature inspection | NEW | Add verifiable local security utilities. |
| Audio inspection/waveform | NEW | Add Web Audio-based local media utilities. |
| DNS/IP/HTTP diagnostics | IMPROVE | Classify as `network-assisted`; require explicit Run; show disclosure. |
| Blanket “100% client-side” marketing | OMIT | Replace with per-tool execution contracts. |
| PWA/offline shell | MATCH | Add installable manifest + same-origin runtime cache. |
| Alias/SEO page multiplication | OMIT | One canonical capability owns many search aliases. |
| Workflow chaining | NEW | Preserve typed output chaining from the existing ToolForge runtime. |
| PPTX→PDF high-fidelity conversion | INVESTIGATE | Do not claim parity without a browser renderer that passes visual acceptance fixtures. |
| OCR→structured spreadsheet | INVESTIGATE | Requires table-structure accuracy fixtures, not OCR text alone. |
| AI background removal | INVESTIGATE | Requires a pinned model/runtime, offline-cache plan and memory/performance budget. |
| Excel/PDF bidirectional conversion | INVESTIGATE | High-fidelity conversion requires a format-specific acceptance corpus. |

## Architecture decision

ToolForge uses a governed `ToolDefinition` registry. Each capability has one ID, aliases, input/output kinds, an execution class, optional file contract, optional network disclosure and a deterministic executor. The UI derives search, catalog, privacy badges, workbench behavior, chaining and registry health from this contract.

Execution classes:

1. `local` — inputs remain inside the browser runtime used by the tool.
2. `network-assisted` — the browser makes an external request; the disclosure is visible before execution and the request requires an explicit button press.
3. `account-sync` — reserved for future optional settings/recipe synchronization; never required for core utilities.

File and network operations default to explicit execution. This prevents expensive transforms or external requests from firing simply because a user selected a tool or typed into an input field.

## Differentiated product thesis

ToolForge is not optimized to win a “largest tool count” contest. It is a local-first Utility OS built around:

- canonical tools instead of duplicate pages;
- explicit execution/privacy contracts;
- composable typed outputs;
- local file transforms where the browser can do the job reliably;
- network requests only where the task inherently requires them;
- deterministic registry validation and search tests;
- installable/offline-capable shell;
- capability expansion only when a tool has working behavior and an acceptance path.

## Clean-room rule

External products supply hypotheses and public behavioral evidence. They do not supply implementation. Unknown behavior stays unknown, and unsupported fidelity claims remain `INVESTIGATE` until a fixture corpus and runtime verification prove them.
