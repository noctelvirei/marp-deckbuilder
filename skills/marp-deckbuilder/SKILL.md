---
name: marp-deckbuilder
description: Builds brandable decks from reports, research, CRM/sales notes, Confluence context, MCP outputs, or pasted briefing data. Use when the user asks for a Deckbuilder deck, editable PPTX, Marp-style slides, sales/report slides, customer briefing deck, executive summary deck, proof deck, or says to use marp-deckbuilder.
---

# Marp Deckbuilder

Use this skill to turn source material into a lightweight component Markdown deck, then build HTML and editable PPTX with the bundled native renderer.

## Core Rule

Do not hand-write PowerPoint code. Write `deck.md` using supported `deck-*` components, then run the bundled CLI. Brand rules, layout coordinates, colors, and fonts live in `tool/resources/definitions/`; see `BRANDING.md` only when updating a branded fork or brand contract. The HTML presenter uses vendored Marp CLI/Bespoke assets in `tool/resources/templates/`; do not recreate or replace that presenter from prompts. The skill runs the bundled `tool/dist/deckbuilder.mjs` runtime and does not need `node_modules`, `npm install`, Marp CLI, LibreOffice, PowerPoint automation, Chromium, or other external executables.

## Workflow

1. Read the user's source material and identify the deck purpose, audience, and desired output.
2. Create one presentation folder for the request. Prefer
   `Documents/Presentations/YYYY-MM-DD/<deck-title-slug>/` when the user has not
   specified a location.
3. Draft `deck.md` in that folder using Marp-style slides separated by `---`.
4. Use supported deck components for native PPTX output:
   `deck-divider`, `deck-stat-grid`, `deck-card-grid`, `deck-chart`, `deck-visual`, `deck-comparison`, `deck-swimlane`, `deck-proof`, `deck-logo-wall`, `deck-next-steps`, `deck-close`.
5. Build the deck:

```bash
node scripts/build-deck.mjs deck.md --out-dir output
```

6. Return links/paths to the generated `.html`, `.pptx`, source `.md`, and
   `resources/` folder if one was requested. By default the HTML is
   self-contained because `resource:` assets are embedded as `data:` URLs.

## Authoring Guidance

- Prefer concise executive language over report prose.
- Treat HTML as the premium presentation format and PPTX as the editable business handoff.
- For reports, analytics, research summaries, and sales/customer briefings, create at least one premium HTML slide that is materially richer than the PPTX version: an annotated SVG dashboard, journey map, funnel, heatmap, process animation, interactive demo, or dense report-style data view.
- Do not make HTML merely mirror the PPTX when the user wants impact. Use raw HTML, inline SVG, scoped CSS, layout grids, annotations, visual flows, and browser JavaScript for high-fidelity HTML slides.
- Use supported `deck-*` components for slides or sections that must remain editable in PowerPoint. If a rich HTML slide is important but not PPTX-editable, pair it with a simpler editable fallback slide.
- Mark premium browser slides with `<!-- pptx: skip -->`. Mark the paired editable fallback with `<!-- html: skip -->` or `<!-- pptx-only: true -->` so the HTML deck does not show duplicate fallback slides.
- Use `deck-divider` for sections, `deck-stat-grid` for headline metrics, `deck-card-grid` for recommendations, `deck-comparison` for option tradeoffs, `deck-proof` for customer/research proof, and `deck-next-steps` for close-out actions.
- Use `deck-chart` only when the chart can be described with structured labels and values.
- Use `deck-visual` for rich inline SVG charts, maps, dashboards, and annotated diagrams. HTML keeps the SVG inline; PPTX embeds the SVG as a crisp visual image. Put essential fills, strokes, fonts, and labels inside the SVG itself because PPTX receives only the SVG. The visual is not editable as PowerPoint shapes, but the source Markdown/SVG remains easy to edit and regenerate.
- Arbitrary HTML, scoped CSS, and JavaScript may be used for premium HTML slides. Mark browser-only slides with `<!-- pptx: skip -->` or `<!-- html-only: true -->`; HTML keeps the slide, while native PPTX omits it cleanly.
- Brand backgrounds and logos are controlled by optional `assets` entries in `tool/resources/definitions/brand.json`. HTML embeds those assets as self-contained data URLs; PPTX inserts them as slide images.
- Keep using `resource:` references for brand images. The renderer embeds them in HTML and inserts them into PPTX; do not paste brand SVG source into Markdown.
- Keep the Markdown compact; the tool owns layout and branding.
- Do not add `paginate: true` unless the user explicitly asks for visible slide numbers.

See [REFERENCE.md](REFERENCE.md) for component syntax and examples.

## Updating A Branded Fork

If this skill has been branded separately, follow `BRANDING.md`. Merge from the public upstream rather than rebuilding the tool from prompts. Preserve the local brand files in `tool/resources/definitions/`, keep the upstream `tool/resources/templates/` Marp/Bespoke presenter assets, and replace the bundled renderer with the upstream `tool/dist/` runtime.
