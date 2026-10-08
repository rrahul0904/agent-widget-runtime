# Clean-room reverse engineering notes

## Observed reference product

The source inspiration is Utily, described publicly as a Next.js/React/TypeScript site with 7,000+ web tools. Observable product ideas include global search, category browsing, bookmark/recents concepts, local-vs-server privacy badges, tool chaining, batches, and app-like multi-tool behavior.

## Public feedback converted into requirements

- Search/navigation is the dominant UX risk at catalog scale.
- Duplicate aliases must collapse into one canonical result (for example, several names for CSV→JSON or JSON formatting).
- Moving UI chrome must never distract from the tool being used.
- SEO scale is valuable only if each tool has useful, tested behavior rather than generated filler.

## What ToolForge changes

1. Canonical registry: one tool identity can own many user-facing aliases.
2. Task search: weighted exact-name, alias, token and tag matching.
3. Composability: compatible output can be passed directly into a next tool.
4. Privacy contracts: seed tools execute entirely in-browser and are explicitly labeled.
5. Registry health: duplicate IDs and duplicate aliases are deterministic verification failures.
6. Quality-first expansion: scale comes from registry packs and reusable execution primitives, not duplicated pages.
7. Local-first personalization: bookmarks and recents work without accounts.

This repository is an original implementation based on externally observable behavior and public feedback; it does not copy source code from Utily.
