---
name: marp-deckbuilder
description: Builds brandable presentation decks with rich HTML slides and editable PPTX output. Use when the user asks for a deck, presentation, slideshow, editable PowerPoint, executive briefing deck, proof deck, or Marp-style slides.
---

# Marp Deckbuilder

Use this skill to turn source material into a lightweight component Markdown deck, then build rich HTML and editable PPTX with the bundled native renderer.

## Core Rule

Do not hand-write PowerPoint code. Write `deck.md` using supported `deck-*` components, then run the bundled CLI. Brand rules, layout coordinates, colors, fonts, logos, and backgrounds live in `tool/resources/definitions/`; see `BRANDING.md` only when updating a branded fork or brand contract.

The HTML deck experience is renderer-owned: the bundled runtime supplies the full-screen navigation shell, progression controls, glass styling, animation hooks, and presenter chrome. Do not hand-author presenter CSS or JavaScript in deck Markdown. The skill runs the bundled `tool/dist/deckbuilder.mjs` runtime and does not need `node_modules`, `npm install`, Marp CLI, LibreOffice, PowerPoint automation, Chromium, or other external executables.

The renderer owns any HTML, CSS, JavaScript, chart runtime, and presenter chrome it needs. Deck Markdown must contain prose, Markdown lists/tables, and supported `deck-*` component calls only.

## Workflow

1. At the start of every new slide-deck request, unless the user has already explicitly answered in the same message, ask the output-format question before drafting or building. Use Claude's radio-button choice UI:

```text
AskUserQuestion({
  header: "Output",
  question: "Do you want PowerPoint, HTML, or both?",
  options: [
    "PowerPoint" — "Editable .pptx handoff using native shapes/charts where the format allows.",
    "HTML" — "Best visual fidelity, full-screen browser navigation, animations, glass styling, and adaptive slide controls.",
    "Both" — "Generate the premium HTML slideshow and the editable PowerPoint handoff."
  ]
})
```

2. Read the user's source material and identify the deck purpose, audience, narrative arc, and selected output format.
3. Create one presentation folder for the request. Prefer `Documents/Presentations/YYYY-MM-DD/<deck-title-slug>/` when the user has not specified a location.
4. Draft `deck.md` in that folder using Marp-style slides separated by `---`.
5. Use supported deck components for native PPTX output: `deck-slide`, `deck-divider`, `deck-stat-grid`, `deck-card-grid`, `deck-chart`, `deck-signal-bars`, `deck-signal-board`, `deck-orchestration`, `deck-funnel`, `deck-metric-trend`, `deck-heatmap`, `deck-impact-radar`, `deck-treemap`, `deck-journey-map`, `deck-journey-path`, `deck-comparison`, `deck-swimlane`, `deck-proof`, `deck-logo-wall`, `deck-next-steps`, `deck-takeaway`, `deck-close`, and the executive layout components (`deck-exec-title`, `deck-exec-rows`, `deck-exec-cards`, `deck-exec-timeline`, `deck-exec-metrics`).
6. Build the deck from this skill folder, passing the selected output:

```bash
node scripts/build-deck.mjs <output-folder>/deck.md --out-dir <output-folder> --output html
node scripts/build-deck.mjs <output-folder>/deck.md --out-dir <output-folder> --output pptx
node scripts/build-deck.mjs <output-folder>/deck.md --out-dir <output-folder> --output both
```

7. Return only the generated file types the user selected, plus the source `.md` and `resources/` folder if one was requested. By default the HTML is self-contained because `resource:` assets are embedded as `data:` URLs.

## Authoring Guidance

- Prefer concise executive slide language.
- Treat HTML as the premium presentation format and PPTX as the editable business handoff.
- Use supported `deck-*` components when the slide must remain editable in PowerPoint.
- Use only documented attributes on `deck-*` components. Unsupported attributes fail validation; fix the Markdown or ask the skill maker to add the missing capability as a renderer-backed component.
- Use `<deck-slide ... />` at the top of a slide for slide metadata such as `layout`, `surface`, `eyebrow`, `takeaway`, `html-skip`, `pptx-skip`, and slide-specific customer/company logo overrides. Do not use HTML comments for new slide metadata.
- Use `**bold**` inside dark cover/divider/title headings to create the branded accent text treatment. Use `<br>` in the heading when that emphasis should become its own row.
- For animated or progressive decks, use controlled `deck-slide` animation metadata (`animation`, `animation-trigger`, `animation-duration`, `animation-delay`, `animation-sequence`). Read `examples/animations.md` for the full working animation showcase; supported entrance animations are also listed in `REFERENCE.md`.
- Use `deck-signal-bars` for a headline metric paired with horizontal contribution/concentration bars. Do not hand-author HTML/SVG/CSS for that pattern.
- Use `deck-signal-board` for a two-panel narrative signal board with summary copy, tag pills, and contribution bars. HTML may include renderer-owned visual polish; PPTX stays static native shapes. Do not hand-author HTML/CSS dashboards for that pattern.
- Use `deck-orchestration` for channel-to-platform-to-system architecture slides. Set `logo="company"` when the central layer should show the configured company wordmark in place of text.
- Use `deck-funnel` for conversion or completion stage funnels. Do not hand-author HTML/SVG/CSS bars for that pattern.
- Use `deck-metric-trend` for a headline KPI paired with a short trend line. Do not hand-author SVG metric dashboards for that pattern.
- Use `deck-heatmap` for activity/intensity grids across two categorical axes. Do not hand-author Observable Plot JavaScript for that pattern.
- Use `deck-impact-radar` for combined impact bars plus radar/balance profiles. HTML may animate the generated SVG; PPTX embeds a static generated SVG. Do not hand-author SVG dashboards for that pattern.
- Use `deck-treemap` for portfolio/composition area charts. Do not hand-author D3 treemap JavaScript for that pattern.
- Use `deck-journey-map` for ordered customer/process journey cards. Do not hand-author HTML/CSS card grids for that pattern.
- Use `deck-journey-path` for metric-led journey path dashboards with stage labels, hotspots, and an intervention callout. HTML may animate the generated path; PPTX embeds a static generated SVG with an editable metric panel.
- Use `deck-chart` for supported chart types: `bar`, `line`, `area`, `waterfall`, `bullet`, `grouped-bar`, `stacked-bar`, `doughnut`, `scatter`, `bubble`, `histogram`, `boxplot`, `pareto`, `radar`, and `sankey`. For exact chart syntax, validation rules, and examples, read `references/charts.md` instead of loading the full reference.
- Do not use `deck-visual`; it is retired because it allowed raw SVG authoring. If a rich chart, map, dashboard, or annotated diagram is needed, use an existing renderer-backed component or ask the skill maker to add a new one.
- Do not write raw `<script>`, `<style>`, `<canvas>`, `<iframe>`, `<div>`, `<section>`, `<article>`, `<figure>`, `<table>`, `<img>`, raw chart containers, or raw SVG. The renderer rejects those tags.
- Use `<deck-slide pptx-skip="true" />` or `<deck-slide html-skip="true" />` only to choose between supported structured alternatives, not to smuggle raw HTML or JavaScript into one output.
- Use `deck-divider` for sections, `deck-stat-grid` for headline metrics, `deck-card-grid` for recommendations, `deck-comparison` for option tradeoffs, `deck-proof` for customer/research proof, and `deck-next-steps` for close-out actions.
- Do not label section dividers as `ACT 01`, `ACT 02`, or similar unless the user or source material explicitly uses an act/play structure. Prefer plain business labels such as `Context`, `Evidence`, `Recommendations`, or `Implementation`.
- Use `icon="filename-stem"` on `deck-card` for icons from `tool/resources/icons/`. Use `icon`, `image`, or `src` for card media; do not put raw `<img>` tags inside cards.
- Reference assets by file name/path, not by asking the renderer to know product-specific names. `icon="face-scan"` resolves dynamically to `tool/resources/icons/face-scan.svg` or another supported image extension if present.
- Use `deck-chart` only when the chart can be described with structured labels and values, documented point rows, raw distribution values, documented observation rows, or documented flow links. Supported types are `bar`, `line`, `area`, `waterfall`, `bullet`, `grouped-bar`, `stacked-bar`, `doughnut`, `scatter`, `bubble`, `histogram`, `boxplot`, `pareto`, `radar`, and `sankey`; ask the skill maker to add any other chart type.
- Keep using `resource:` references for brand images. The renderer embeds them in HTML and inserts them into PPTX; do not paste brand SVG source into Markdown.
- Let the renderer own brand chrome. Do not set `marp`, `theme`, or raw company-logo HTML in `deck.md`; the build uses `brand.themeName`, `brand.assets`, and `brand.layouts`.
- Treat slide surface as a design choice, with dark as the default deck language and light as an explicit option. Cover, divider, and close slides use dark header treatment and may use image backgrounds; normal content/component slides default dark with renderer-owned gradient/glass backgrounds unless frontmatter or slide metadata says otherwise. Use `defaultSurface: light`, `<deck-slide surface="light" />`, or `surface="light"` on an executive component when a light slide is intentional.
- Use executive layout components for CEO-style large-format slides: oversized titles, wide row stacks, large metric cards, timeline rows, side callouts, and takeaway bars. They support both dark and light surfaces with the same geometry.
- Put customer logo metadata in frontmatter (`customerLogo` plus optional `customerName`, or `customer.logo` plus `customer.name`). The renderer places the company logo top left and customer logo top right in both HTML and PPTX.
- Customer logos and logo-wall assets should be supplied as transparent PNG assets prepared for the chosen deck surface (for example, white wordmark text for dark slides). Authors reference one logical logo; the renderer automatically prefers sibling variants such as `customer.dark.png`, `customer-on-dark.png`, `customer.light.png`, or `customer-on-light.png` when present. The renderer does not add a white chip by default. Do not try to invert customer logos with CSS filters; that breaks brand colours. A branded fork may opt into `customerLogoBackplate` only for legacy assets.
- Keep card, swimlane, comparison, and next-step copy concise. The PPTX renderer clamps text boxes inside their filled shapes, but dense copy is still a deck-design problem and should move to a follow-up slide or speaker notes.
- The renderer fails loudly on invalid component Markdown or missing assets. If the build errors, fix the Markdown or add the referenced file under `tool/resources/`; do not work around it by leaving empty cards, broken images, or unsupported component shapes.
- If the requested slide type, chart, visual, or layout is not available as documented syntax, tell the user to ask the skill maker to add it. Do not invent raw HTML, CSS, JavaScript, SVG, or extra attributes as a workaround.
- Keep the Markdown compact; the tool owns layout and branding.
- Do not add `paginate: true` unless the user explicitly asks for visible slide numbers.

## Raw HTML Guardrail

Raw HTML/CSS/JavaScript is not an authoring escape hatch. If the user asks for an interaction, chart, animation, visual, or slide layout that is not available in this reference, stop and tell them to ask the skill maker to add it as a renderer-backed `deck-*` component.

## PPTX Fidelity

For PPTX, use one of these renderer-backed patterns:

- `deck-chart` for editable native bar, line, area, grouped-bar, stacked-bar, doughnut, scatter, or bubble charts, plus renderer-owned waterfall, bullet, histogram, boxplot, pareto, radar, and sankey charts.
- Supported structured components that can render richer HTML and PPTX-friendly static or editable output.
- Supported structured alternatives separated with `deck-slide` skip metadata when HTML and PPTX need different renderer-backed representations.

See [REFERENCE.md](REFERENCE.md) for all component syntax, directives, and premium slide patterns. For chart-only questions, read [references/charts.md](references/charts.md) first to keep context small.

## Updating A Branded Fork

If this skill has been branded separately, follow `BRANDING.md`. Merge from the public upstream rather than rebuilding the tool from prompts. Preserve the local brand files in `tool/resources/definitions/`, keep any upstream renderer resources under `tool/resources/`, and replace the bundled renderer with the upstream `tool/dist/` runtime.
