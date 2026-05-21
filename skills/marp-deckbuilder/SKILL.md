---
name: marp-deckbuilder
description: Builds brandable decks from reports, research, CRM/sales notes, Confluence context, MCP outputs, or pasted briefing data. Use when the user asks for a Deckbuilder deck, editable PPTX, Marp-style slides, sales/report slides, customer briefing deck, executive summary deck, proof deck, or says to use marp-deckbuilder.
---

# Marp Deckbuilder

Use this skill to turn source material into a lightweight component Markdown deck, then build HTML and editable PPTX with the bundled native renderer.

## Core Rule

Do not hand-write PowerPoint code. Write `deck.md` using supported `deck-*` components, then run the bundled CLI. Brand rules, layout coordinates, colors, and fonts live in `tool/resources/definitions/`; see `BRANDING.md` only when updating a branded fork or brand contract. The HTML presenter uses vendored Marp CLI/Bespoke assets in `tool/resources/templates/`; do not recreate or replace that presenter from prompts. The skill runs the bundled `tool/dist/deckbuilder.cjs` file and does not need `node_modules`, `npm install`, Marp CLI, LibreOffice, PowerPoint automation, Chromium, or other external executables.

## Workflow

1. Read the user's source material and identify the deck purpose, audience, and desired output.
2. Create an output folder for the request.
3. Draft `deck.md` using Marp-style slides separated by `---`.
4. Use supported deck components for native PPTX output:
   `deck-divider`, `deck-stat-grid`, `deck-card-grid`, `deck-chart`, `deck-visual`, `deck-comparison`, `deck-swimlane`, `deck-proof`, `deck-logo-wall`, `deck-next-steps`, `deck-close`.
5. Build the deck:

```bash
node scripts/build-deck.mjs deck.md --out-dir output
```

6. Return links/paths to the generated `.html`, `.pptx`, and source `.md`.

## Authoring Guidance

- Prefer concise executive language over report prose.
- Treat HTML as the premium presentation format and PPTX as the editable business handoff.
- Do not make HTML merely mirror the PPTX when the user wants impact. Use rich HTML, inline SVG, scoped CSS, layout grids, annotations, visual flows, and report-style data views for high-fidelity HTML slides.
- Use supported `deck-*` components for slides or sections that must remain editable in PowerPoint. If a rich HTML slide is important but not PPTX-editable, add a simpler editable component slide or summary immediately after it.
- Use `deck-divider` for sections, `deck-stat-grid` for headline metrics, `deck-card-grid` for recommendations, `deck-comparison` for option tradeoffs, `deck-proof` for customer/research proof, and `deck-next-steps` for close-out actions.
- Use `deck-chart` only when the chart can be described with structured labels and values.
- Use `deck-visual` for rich inline SVG charts, maps, dashboards, and annotated diagrams. HTML keeps the SVG inline; PPTX embeds the SVG as a crisp visual image. Put essential fills, strokes, fonts, and labels inside the SVG itself because PPTX receives only the SVG. The visual is not editable as PowerPoint shapes, but the source Markdown/SVG remains easy to edit and regenerate.
- Arbitrary HTML may be used for premium HTML slides, but it is not guaranteed editable in native PPTX.
- Keep the Markdown compact; the tool owns layout and branding.

See [REFERENCE.md](REFERENCE.md) for component syntax and examples.

## Updating A Branded Fork

If this skill has been branded separately, follow `BRANDING.md`. Merge from the public upstream rather than rebuilding the tool from prompts. Preserve the local brand files in `tool/resources/definitions/`, keep the upstream `tool/resources/templates/` Marp/Bespoke presenter assets, and replace the bundled renderer with the upstream `tool/dist/deckbuilder.cjs`.
