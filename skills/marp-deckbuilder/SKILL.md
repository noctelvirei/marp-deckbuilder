---
name: marp-deckbuilder
description: Builds brandable presentation decks with rich HTML slides and editable PPTX output. Use when the user asks for a deck, presentation, slideshow, editable PowerPoint, executive briefing deck, proof deck, or Marp-style slides.
---

# Marp Deckbuilder

Use this skill to turn source material into a lightweight component Markdown deck, then build rich HTML and editable PPTX with the bundled native renderer.

## Core Rule

Do not hand-write PowerPoint code. Write `deck.md` using supported `deck-*` components, then run the bundled CLI. Brand rules, layout coordinates, colors, fonts, logos, and backgrounds live in `tool/resources/definitions/`; see `BRANDING.md` only when updating a branded fork or brand contract.

The HTML presenter uses vendored Marp CLI/Bespoke assets in `tool/resources/templates/`. Do not recreate or replace that presenter from prompts. The skill runs the bundled `tool/dist/deckbuilder.mjs` runtime and does not need `node_modules`, `npm install`, Marp CLI, LibreOffice, PowerPoint automation, Chromium, or other external executables.

The build wrapper injects Chart.js, Observable Plot, and D3 into the generated HTML head from local vendor files, so browser-only slides using those libraries work offline after generation. Do not paste minified library source into Markdown.

## Workflow

1. Read the user's source material and identify the deck purpose, audience, narrative arc, and desired output.
2. Create one presentation folder for the request. Prefer `Documents/Presentations/YYYY-MM-DD/<deck-title-slug>/` when the user has not specified a location.
3. Draft `deck.md` in that folder using Marp-style slides separated by `---`.
4. Use supported deck components for native PPTX output: `deck-divider`, `deck-stat-grid`, `deck-card-grid`, `deck-chart`, `deck-visual`, `deck-comparison`, `deck-swimlane`, `deck-proof`, `deck-logo-wall`, `deck-next-steps`, `deck-takeaway`, `deck-close`, and the executive layout components (`deck-exec-title`, `deck-exec-rows`, `deck-exec-cards`, `deck-exec-timeline`, `deck-exec-metrics`).
5. Build the deck from this skill folder:

```bash
node scripts/build-deck.mjs <output-folder>/deck.md --out-dir <output-folder>
```

6. Return the generated `.html`, `.pptx`, source `.md`, and `resources/` folder if one was requested. By default the HTML is self-contained because `resource:` assets are embedded as `data:` URLs.

## Authoring Guidance

- Prefer concise executive slide language.
- Treat HTML as the premium presentation format and PPTX as the editable business handoff.
- Use supported `deck-*` components when the slide must remain editable in PowerPoint.
- Use `deck-visual` for rich inline SVG charts, maps, dashboards, and annotated diagrams. HTML keeps the SVG inline; PPTX embeds the SVG as a crisp visual image. Put essential fills, strokes, fonts, and labels inside the SVG because PPTX receives only the SVG.
- Use browser-only HTML, scoped CSS, and JavaScript when the HTML slide needs richer behavior than PowerPoint can edit. Mark those slides with `<!-- pptx: skip -->` or `<!-- html-only: true -->`.
- Pair each browser-only slide with a simpler editable fallback marked `<!-- html: skip -->`, `<!-- html-skip: true -->`, or `<!-- pptx-only: true -->` when the PPTX audience needs the same point.
- Use Chart.js for standard bar, stacked bar, line, and doughnut slides.
- Use Observable Plot for concise dot, area, heatmap, and small-multiple slides.
- Use D3 for bespoke SVG visuals such as treemaps, custom arcs, Sankey-style flows, and force layouts.
- Use `deck-divider` for sections, `deck-stat-grid` for headline metrics, `deck-card-grid` for recommendations, `deck-comparison` for option tradeoffs, `deck-proof` for customer/research proof, and `deck-next-steps` for close-out actions.
- Do not label section dividers as `ACT 01`, `ACT 02`, or similar unless the user or source material explicitly uses an act/play structure. Prefer plain business labels such as `Context`, `Evidence`, `Recommendations`, or `Implementation`.
- Use `icon="filename-stem"` on `deck-card` for icons from `tool/resources/icons/`. Do not put raw `<img>` tags inside cards unless you need to; `icon`, `image`, and `src` are the supported card media contract and work in both HTML and PPTX.
- Reference assets by file name/path, not by asking the renderer to know product-specific names. `icon="face-scan"` resolves dynamically to `tool/resources/icons/face-scan.svg` or another supported image extension if present.
- Use `deck-chart` only when the chart can be described with structured labels and values.
- Keep using `resource:` references for brand images. The renderer embeds them in HTML and inserts them into PPTX; do not paste brand SVG source into Markdown.
- Let the renderer own brand chrome. Do not set `marp`, `theme`, or raw company-logo HTML in `deck.md`; the build uses `brand.themeName`, `brand.assets`, and `brand.layouts`.
- Treat slide surface as a design choice, not a layout rule. Cover, divider, and close slides default dark for compatibility; other slides default light unless frontmatter or a directive says otherwise. Use `defaultSurface: dark|light` for a whole deck, `<!-- surface: dark|light -->` for a slide, or `surface="dark|light"` on an executive component. Do not assume executive headers are dark or content pages are white.
- Use executive layout components for CEO-style large-format slides: oversized titles, wide row stacks, large metric cards, timeline rows, side callouts, and takeaway bars. They support both dark and light surfaces with the same geometry.
- Put customer logo metadata in frontmatter (`customerLogo` plus optional `customerName`, or `customer.logo` plus `customer.name`). The renderer places the company logo top left and customer logo top right in both HTML and PPTX.
- Customer logos and logo-wall assets should be supplied as transparent PNG assets prepared for the chosen deck surface (for example, white wordmark text for dark slides). Authors reference one logical logo; the renderer automatically prefers sibling variants such as `customer.dark.png`, `customer-on-dark.png`, `customer.light.png`, or `customer-on-light.png` when present. The renderer does not add a white chip by default. Do not try to invert customer logos with CSS filters; that breaks brand colours. A branded fork may opt into `customerLogoBackplate` only for legacy assets.
- Keep card, swimlane, comparison, and next-step copy concise. The PPTX renderer clamps text boxes inside their filled shapes, but dense copy is still a deck-design problem and should move to a follow-up slide or speaker notes.
- The renderer fails loudly on invalid component Markdown or missing assets. If the build errors, fix the Markdown or add the referenced file under `tool/resources/`; do not work around it by leaving empty cards, broken images, or unsupported component shapes.
- Keep the Markdown compact; the tool owns layout and branding.
- Do not add `paginate: true` unless the user explicitly asks for visible slide numbers.

## Script Rules For Premium Slides

1. Do not include CDN `<script src>` tags in `deck.md`. The build wrapper injects bundled vendor libraries into the final HTML head.
2. Put chart containers on browser-only slides marked `<!-- pptx: skip -->`.
3. Put init `<script>` blocks on the same browser-only slide as the chart container, after the chart container.
4. Use `document.addEventListener('DOMContentLoaded', function() { ... })` for library initializers unless the script is visibly after the target DOM node and does not depend on layout timing.
5. Never use em dashes or double-hyphen separators in JavaScript comments inside Markdown. Use simple comments such as `// Bar chart section`.

## PPTX Fidelity

PowerPoint cannot run browser JavaScript. For PPTX, use one of these patterns:

- `deck-chart` for editable native bar or line charts.
- `deck-visual` with inline SVG for a faithful raster/media visual in PPTX and inline SVG in HTML.
- A browser-only JS slide paired with an editable fallback slide when interaction is valuable in HTML.

See [REFERENCE.md](REFERENCE.md) for all component syntax, directives, and premium slide patterns.

## Updating A Branded Fork

If this skill has been branded separately, follow `BRANDING.md`. Merge from the public upstream rather than rebuilding the tool from prompts. Preserve the local brand files in `tool/resources/definitions/`, keep the upstream `tool/resources/templates/` Marp/Bespoke presenter assets, and replace the bundled renderer with the upstream `tool/dist/` runtime.
