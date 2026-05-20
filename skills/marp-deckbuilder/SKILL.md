---
name: marp-deckbuilder
description: Builds brandable decks from reports, research, CRM/sales notes, Confluence context, MCP outputs, or pasted briefing data. Use when the user asks for a Deckbuilder deck, editable PPTX, Marp-style slides, sales/report slides, customer briefing deck, executive summary deck, proof deck, or says to use marp-deckbuilder.
---

# Marp Deckbuilder

Use this skill to turn source material into a lightweight component Markdown deck, then build HTML and editable PPTX with the bundled native renderer.

## Core Rule

Do not hand-write PowerPoint code. Write `deck.md` using supported `deck-*` components, then run the bundled CLI. Brand rules, layout coordinates, colors, fonts, and rendering mechanics live in `tool/resources/definitions/`. The skill runs the bundled `tool/dist/deckbuilder.cjs` file and does not need `node_modules`, `npm install`, Marp CLI, LibreOffice, PowerPoint automation, Chromium, or other external executables.

## Workflow

1. Read the user's source material and identify the deck purpose, audience, and desired output.
2. Create an output folder for the request.
3. Draft `deck.md` using Marp-style slides separated by `---`.
4. Use only supported deck components for native PPTX editability:
   `deck-divider`, `deck-stat-grid`, `deck-card-grid`, `deck-chart`, `deck-comparison`, `deck-swimlane`, `deck-proof`, `deck-logo-wall`, `deck-next-steps`, `deck-close`.
5. Build the deck:

```bash
node scripts/build-deck.mjs deck.md --out-dir output
```

6. Return links/paths to the generated `.html`, `.pptx`, and source `.md`.

## Authoring Guidance

- Prefer concise executive language over report prose.
- Use `deck-divider` for sections, `deck-stat-grid` for headline metrics, `deck-card-grid` for recommendations, `deck-comparison` for option tradeoffs, `deck-proof` for customer/research proof, and `deck-next-steps` for close-out actions.
- Use `deck-chart` only when the chart can be described with structured labels and values.
- Arbitrary HTML may be used for HTML-only slides, but it is not guaranteed editable in native PPTX.
- Keep the Markdown compact; the tool owns layout and branding.

See [REFERENCE.md](REFERENCE.md) for component syntax and examples.
