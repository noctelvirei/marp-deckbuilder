# Marp Deckbuilder Agent Guide

This repository builds two portable, brandable Markdown skills:

- `marp-deckbuilder`: builds presentation decks as HTML slideshows and editable PPTX files.
- `marp-report`: builds long-form, scrollable HTML reports that can be printed to PDF.

This README is written for coding agents. It explains the project shape, the safe editing surface, the branding contract, and how to make changes without confusing authored Markdown, generated bundles, brand assets, and runtime code.

## Mental Model

Markdown is the source of truth. The renderer owns brand chrome, logos, surfaces, backgrounds, theme colours, and PPTX geometry.

Do not hand-build PowerPoint files. Do not ask an agent to recreate the renderer from screenshots. Change source code or brand definitions, rebuild the skills, then test the generated HTML and PPTX.

There are three layers:

1. Source runtime in `src/`
   - The real implementation lives here.
   - Edit these files when changing parsing, rendering, PPTX output, report output, or component behaviour.

2. Brand resources in `resources/`
   - Default public brand definitions and assets live here.
   - Branded forks replace these definitions and assets, not the renderer logic.

3. Portable skills in `skills/`
   - These are distributable skill payloads.
   - `tool/dist/` is generated output. Never hand-edit it.
   - Rebuild it with `npm run bundle:skill` or `npm run package:skill`.

## Which Skill To Use

| Need | Use | Output | Notes |
| --- | --- | --- | --- |
| A presentation, PowerPoint, slide deck, board deck, sales deck, or executive deck | `skills/marp-deckbuilder` | HTML slideshow plus editable PPTX | Use known `deck-*` components when PPTX editability matters. |
| A written report, readout, analysis document, findings summary, or browser page to print | `skills/marp-report` | Single HTML report | Browser charts can be higher fidelity than PPTX. Print to PDF from the browser. |

Keep these skills separate. They can share capabilities and visual language, but one creates decks and the other creates reports.

## Project Map

Root files:

- `README.md`: this agent operating guide.
- `package.json`: npm scripts, dependencies, and the CLI entrypoint.
- `samples/`: source Markdown examples used for smoke tests and manual checks.
- `dist/`: local build output. Treat as disposable.
- `.tmp/`: local temporary output. Treat as disposable.

Runtime source:

- `src/cli.js`: command-line entrypoint. Supports deck and report commands.
- `src/markdown.js`: frontmatter, slide splitting, directives, surface inference, and component collection.
- `src/components.js`: component validation and compilation pipeline.
- `src/components/parsers.js`: parses custom `deck-*` tags into structured models.
- `src/components/renderers.js`: renders component models into HTML.
- `src/components/utils.js`: shared component helpers.
- `src/render.js`: HTML deck rendering, Marp/Bespoke shell integration, brand chrome injection.
- `src/pptx.js`: PPTX deck orchestration and component dispatch.
- `src/pptx/renderers.js`: native PPTX rendering for each supported deck component.
- `src/pptx/helpers.js`: PPTX geometry, text, image, and fitting helpers.
- `src/report.js`: long-form report HTML renderer.
- `src/brand.js`: loads and normalizes brand definitions.
- `src/resources.js`: resolves `resource:` assets.

Brand and presenter resources:

- `resources/definitions/brand.json`: slide size, colours, fonts, layout geometry, asset references, and component layout settings.
- `resources/definitions/theme.css`: HTML slide theme and component styling.
- `resources/templates/`: vendored Marp/Bespoke presenter shell for HTML decks.
- `resources/vendor/`: vendored chart libraries used by reports and rich HTML output.
- `resources/*.svg`, `resources/*.png`, fonts, screenshots: reusable assets.

Portable skills:

- `skills/marp-deckbuilder/SKILL.md`: concise deck skill instructions for agents.
- `skills/marp-deckbuilder/REFERENCE.md`: full deck syntax reference.
- `skills/marp-deckbuilder/BRANDING.md`: branded fork contract.
- `skills/marp-deckbuilder/scripts/build-deck.mjs`: deck build wrapper used inside the skill.
- `skills/marp-deckbuilder/tool/dist/`: generated runtime bundle for the deck skill.
- `skills/marp-deckbuilder/tool/resources/`: resources bundled with the deck skill.
- `skills/marp-report/SKILL.md`: concise report skill instructions for agents.
- `skills/marp-report/REFERENCE.md`: report component and chart reference.
- `skills/marp-report/scripts/build-report.mjs`: report build wrapper used inside the skill.
- `skills/marp-report/tool/dist/`: generated runtime bundle for the report skill.
- `skills/marp-report/tool/resources/`: resources bundled with the report skill.

Packaging and tests:

- `scripts/bundle-skill.mjs`: bundles source runtime into both skills.
- `scripts/smoke-skill.mjs`: runs isolated skill smoke tests.
- `scripts/package-skill.mjs`: packages the skills and checks size limits.
- `test/`: node tests for parsing, rendering, branding, and PPTX behaviour.

## Install And Build

Install dependencies from the repository root:

```powershell
npm install
```

Build a deck directly from source:

```powershell
node src/cli.js build samples/demo.md --html dist/demo.html --pptx dist/demo.pptx --resources resources
```

Build a report directly from source:

```powershell
node src/cli.js report skills/marp-report/examples/example.md --html dist/report.html --resources resources
```

Build through the deck skill wrapper:

```powershell
node skills\marp-deckbuilder\scripts\build-deck.mjs skills\marp-deckbuilder\examples\example.md --out-dir dist\skill-deck
```

Build through the report skill wrapper:

```powershell
node skills\marp-report\scripts\build-report.mjs skills\marp-report\examples\example.md --out-dir dist\skill-report
```

Run validation:

```powershell
npm test
npm run check
npm run bundle:skill
npm run smoke:skill
```

Create distributable skill packages:

```powershell
npm run package:skill
```

`package:skill` rebuilds the skill runtimes, runs isolated smoke tests, excludes output/cache folders, and fails if a skill exceeds the package size limit.

## Authoring Decks

Deck Markdown uses Marp-style slide separators:

```md
---
title: Example Deck
customer:
  name: Example Bank
  logo: resource:customers/example-bank.svg
---

<!-- surface: dark -->

<deck-exec-title
  eyebrow="Investor Update"
  title="Scaling with precision."
  subtitle="Building the AI runtime for enterprise customer journeys."
  surface="dark"
></deck-exec-title>

---

<!-- surface: light -->

# Operating signals

<deck-stat-grid>
  <deck-stat value="50+" label="Enterprise customers"></deck-stat>
  <deck-stat value="20+" label="Fortune 500 logos"></deck-stat>
</deck-stat-grid>
```

Use known components for native editable PPTX:

- `deck-divider`
- `deck-stat-grid` and `deck-stat`
- `deck-card-grid` and `deck-card`
- `deck-chart`
- `deck-visual`
- `deck-comparison` and `deck-row`
- `deck-swimlane`, `deck-lane`, and `deck-step`
- `deck-proof`
- `deck-logo-wall` and `deck-logo`
- `deck-next-steps` and `deck-step`
- `deck-takeaway`
- `deck-close`
- Executive components: `deck-exec-title`, `deck-exec-rows`, `deck-exec-cards`, `deck-exec-timeline`, `deck-exec-metrics`

Use `skills/marp-deckbuilder/REFERENCE.md` for exact syntax and examples.

### PPTX Editability Contract

The native PPTX renderer only promises editability for known components and normal Markdown text.

Editable in PPTX:

- Markdown headings and paragraphs.
- Known `deck-*` components.
- Native `deck-chart` charts.
- Shapes, cards, rows, timelines, logo walls, and text created by the PPTX renderer.

Not automatically editable in PPTX:

- Arbitrary HTML/CSS.
- Browser-only JavaScript.
- Complex custom SVG unless embedded through `deck-visual`.

If a visual must stay editable in PowerPoint, add or extend a structured component. If a visual only needs to look good, use HTML/SVG and pair it with a PPTX-friendly fallback where needed.

## Slide Surfaces And CEO-Style Layouts

Do not hard-code "dark header pages and white content pages" as a design law. The project now supports dark and light versions of the executive style.

Surface is a design choice independent of layout:

- Use `defaultSurface: dark` or `defaultSurface: light` in frontmatter for the deck-wide default.
- Use `<!-- surface: dark -->` or `<!-- surface: light -->` for a single slide.
- Use `surface="dark"` or `surface="light"` on executive components.

Good agent rule:

- Pick the surface that best supports the story, brand contrast, and CEO-style composition.
- Keep all text readable on that surface.
- Use larger, more spacious executive layouts for CEO-style decks.
- Split crowded content across slides instead of shrinking everything into dense boxes.

The executive components are for large visual hierarchy:

- `deck-exec-title`: big chapter/title slide.
- `deck-exec-rows`: large row stack with optional side callout.
- `deck-exec-cards`: large cards, vectors, and target slides.
- `deck-exec-timeline`: three-milestone story slide.
- `deck-exec-metrics`: large metrics and panels.

These components exist because arbitrary placeholder-driven PowerPoint layouts produced overlapping titles, tiny boxes, unreadable text, and inconsistent sizing. Prefer these components over freehand HTML when the output must meet executive presentation standards.

## Logos, Backgrounds, And Brand Chrome

The renderer owns logo placement.

Default rule:

- Company logo: top left.
- Customer logo, when present: top right.

Do not hand-position logos in Markdown unless you are deliberately making a one-off visual. Brand chrome should come from `brand.json`, `theme.css`, and renderer logic.

Important logo behaviour:

- Use different company logo assets for dark and light surfaces when needed.
- Use `assets.logo.dark` for dark surfaces and `assets.logo.light` for light surfaces.
- Customer logos should keep their original brand colours.
- Customer logos should be supplied as transparent PNGs prepared for the chosen surface.
- For dark executive decks, use customer logo PNG exports with light/white wordmark text and no white rectangle behind the logo.
- Authors still reference one logical logo in Markdown. This applies to `customerLogo` frontmatter and `deck-logo-wall` images. If the reference is `resource:customers/hsbc.png`, the renderer automatically prefers `customers/hsbc.dark.png`, `customers/hsbc-dark.png`, `customers/hsbc.on-dark.png`, or `customers/hsbc-on-dark.png` on dark slides when present. On light slides it similarly prefers `.light`, `-light`, `.on-light`, or `-on-light` siblings. If no surface variant exists, it falls back to the original asset.
- Surface variants may use a different image extension from the canonical reference, so `resource:customers/hsbc.svg` can resolve to `customers/hsbc.dark.png` when marketing supplies that file.
- Do not rely on CSS filter inversion.
- Use `customerLogoBackplate: true` only as a legacy fallback when a customer asset cannot be prepared as a transparent PNG.

Important background behaviour:

- Backgrounds can be surface-specific and layout-specific.
- Use brand assets in `brand.json`, not raw image paths scattered through Markdown.
- Dark and light surfaces both need readable text tokens.

Example asset contract:

```json
{
  "assets": {
    "backgrounds": {
      "cover": "resource:brand-title-bg.png",
      "divider": "resource:brand-title-bg.png",
      "close": "resource:brand-title-bg.png",
      "content": "resource:brand-content-bg.png",
      "dark": "resource:brand-dark-bg.png",
      "light": "resource:brand-light-bg.png"
    },
    "logo": {
      "dark": "resource:brand-logo-light.svg",
      "light": "resource:brand-logo-dark.svg"
    }
  },
  "layouts": {
    "companyLogo": { "x": 36, "y": 21, "w": 98, "h": 24 },
    "customerLogo": { "x": 828, "y": 21, "w": 98, "h": 24 }
  }
}
```

## Branding A Fork

For a branded internal fork, change the brand layer first. Do not rewrite the runtime to apply a brand.

Allowed branded changes:

- `skills/marp-deckbuilder/tool/resources/definitions/brand.json`
- `skills/marp-deckbuilder/tool/resources/definitions/theme.css`
- `skills/marp-deckbuilder/tool/resources/`
- `skills/marp-report/tool/resources/definitions/brand.json`
- `skills/marp-report/tool/resources/definitions/theme.css`
- `skills/marp-report/tool/resources/`
- Brief branded workflow notes in each skill's `SKILL.md`

Do not edit for brand-only changes:

- `tool/dist/`
- `tool/resources/templates/`
- component names or syntax
- build wrappers, unless the skill packaging layout changes

In this source repository, canonical public resources live under `resources/`. Bundling copies the runtime and resources into the skill folders. In a branded fork, preserve branded definitions and private assets when pulling public upstream runtime fixes.

Safe branded merge pattern:

1. Commit or branch before starting.
2. Pull upstream public changes.
3. Preserve branded `tool/resources/definitions/` and private assets.
4. Accept upstream `tool/dist/`, `templates/`, scripts, tests, examples, and docs where applicable.
5. Carefully merge `SKILL.md` so branded workflow notes stay but upstream component guidance is not lost.
6. Build a representative deck and report.
7. Check both HTML and PPTX before packaging.

See `skills/marp-deckbuilder/BRANDING.md` for the shorter branded-fork contract.

### Branded Fork Import Prompt

When importing this upstream into a branded fork, give the local agent an explicit rewrite instruction like this:

```text
Read the upstream README.md and skills/marp-deckbuilder/BRANDING.md. Rewrite this branded fork's local branding/import documentation to match the upstream renderer contract, component guidance, slide-surface model, logo rules, and safe merge process. Preserve all business-specific requirements, private brand names, colours, assets, client-specific workflow notes, and internal distribution instructions. Do not copy public placeholder branding over private branding. Do not edit generated tool/dist files by hand.
```

Use this prompt after pulling upstream but before asking the agent to change branded resources. It prevents the branded fork from keeping stale rules such as "all headers are dark and all content slides are white" when the upstream renderer now supports independent dark and light surfaces.

## Authoring Reports

Reports are not slide decks. They are browser-first documents.

Use reports for:

- Findings summaries.
- Usage reports.
- Customer analytics readouts.
- Long-form executive documents.
- Outputs where browser rendering, high-resolution charts, and print-to-PDF are better than PPTX.

Reports can use:

- Built-in dark report theme via `reportTheme: dark`.
- Generated sticky navigation via `reportNav: true`.
- Sticky sidebars.
- Compact `report-*` component tags that the renderer expands into HTML, CSS, and JavaScript.
- Metric cards via `report-metric-grid`.
- Metadata summaries via `report-key-values`.
- Ranked rate bars via `report-rate-bars`.
- Formatted data tables via `report-data-table`.
- Source and methodology notes via `report-source-note`.
- Callouts via `report-callout`.
- Accent cards via `report-accent-card`.
- Badges via `report-badge`.
- Captioned embedded images via `report-figure`.
- Tables.
- Chart.js charts via `report-chart type="bar"`, `line`, and `doughnut`.
- Chart.js grouped bars via `report-chart type="grouped-bar"`.
- Observable Plot charts via `report-chart type="area"`.
- D3 charts via `report-chart type="treemap"`.
- D3 funnels via `report-chart type="funnel"`.

The report build wrapper injects vendored chart libraries into the generated HTML head and strips known CDN tags. Report Markdown should contain prose, Markdown tables/lists, and supported `report-*` component calls only. Agents should not paste raw HTML, inline SVG, CSS, minified library code, chart containers, or chart initializer scripts into report Markdown. If a display type is missing, the report authoring skill should tell the user to ask the skill maker to add it as a renderer-backed report component.

Use `skills/marp-report/SKILL.md` and `skills/marp-report/REFERENCE.md` for report-specific syntax. Keep report guidance out of the presentation skill unless it is a shared concept.

## Adding Or Changing A Component

When adding a deck component, update the whole pipeline:

1. Parser
   - Add model parsing in `src/components/parsers.js`.

2. Validation and registration
   - Register the tag and enforce parent/child rules in `src/components.js`.
   - Fail fast for malformed component structures.

3. HTML renderer
   - Add HTML output in `src/components/renderers.js`.
   - Add theme CSS in `resources/definitions/theme.css`.

4. Surface and layout inference
   - Update `src/markdown.js` if the component affects slide layout, title inference, or surface inference.

5. PPTX renderer
   - Add native output in `src/pptx/renderers.js`.
   - Add dispatch in `src/pptx.js`.
   - Use helpers from `src/pptx/helpers.js`.

6. Documentation
   - Add syntax to `skills/marp-deckbuilder/REFERENCE.md`.
   - Add concise agent guidance to `skills/marp-deckbuilder/SKILL.md` if the component changes authoring behaviour.

7. Tests and packaging
   - Add or update tests in `test/`.
   - Run `npm test`, `npm run check`, `npm run bundle:skill`, and `npm run smoke:skill`.

When adding report capability, update:

- `src/report.js`
- `src/report-components.js`
- `src/report-components/parsers.js`
- `src/report-components/renderers.js`
- `skills/marp-report/SKILL.md`
- `skills/marp-report/REFERENCE.md`
- `skills/marp-report/examples/`
- report tests and smoke coverage if relevant

## Common Agent Mistakes

Avoid these:

- Manually placing company or customer logos in normal deck Markdown.
- Assuming every header slide must be dark and every content slide must be white.
- Using black text on dark backgrounds or pale text on white backgrounds.
- Using customer logo assets that were exported for the wrong surface.
- Using arbitrary HTML when the user needs editable PPTX.
- Editing `tool/dist/` by hand.
- Editing generated skill bundles instead of source files.
- Pasting vendored JavaScript libraries into Markdown.
- Relying on CSS filter inversion for customer logos.
- Shrinking a crowded slide until the typography fails.
- Letting text overflow boxes instead of using correct component geometry or splitting the slide.
- Leaving PowerPoint placeholder text such as "Click to add title" in generated output.

Good defaults:

- Use structured components for PPTX.
- Use `deck-visual` for SVG visuals that can be rasterized into PPTX media.
- Use executive components for CEO-style decks with large typography and generous spacing.
- Use reports when the output wants high-fidelity browser charts.
- Keep all colours surface-aware.
- Test both HTML and PPTX.

## Troubleshooting

Wrong logo appears:

- Check `brand.json` `assets.logo.dark` and `assets.logo.light`.
- Check `layouts.companyLogo`.
- Check whether the slide surface is dark or light.
- Do not patch this in Markdown.

Customer logo missing or unreadable:

- Check frontmatter customer logo path.
- Check `resource:` asset exists.
- Check `layouts.customerLogo`.
- On dark slides, ensure the customer logo is a transparent PNG prepared for dark backgrounds, or add a sibling variant such as `customer.dark.png` / `customer-on-dark.png` next to the referenced asset.
- Use `customerLogoBackplate: true` only for legacy assets that cannot be prepared cleanly.

Wrong background:

- Check slide surface.
- Check `assets.backgrounds`.
- Check whether the layout is cover, divider, close, content, dark, or light.
- Confirm the asset exists under the skill's `tool/resources/`.

HTML looks good but PPTX is wrong:

- Confirm the slide uses known components.
- Arbitrary HTML does not become editable PowerPoint objects.
- Add a PPTX fallback or implement native PPTX rendering.

Text overflows or is misaligned:

- Check PPTX geometry in `brand.json` and `src/pptx/renderers.js`.
- Check text box padding and vertical alignment helpers.
- Split crowded content across slides if the copy is too long.

Chart is low fidelity in PPTX:

- Native PPTX charts are editable but less visually rich.
- Browser/report charts can be higher resolution.
- Use a report or an HTML/SVG `deck-visual` when fidelity matters more than editability.

Skill wrapper fails but source CLI works:

- Run `npm run bundle:skill`.
- Confirm `skills/*/tool/dist/deckbuilder.mjs` exists.
- Confirm `skills/*/tool/resources/` contains definitions, templates, vendor assets, and referenced images.

## Git Hygiene

Before modifying this repository:

```powershell
git status --short --branch
```

For meaningful work, create a branch or make sure you are already on a task branch. Commit after each coherent change so there is a restore point.

Useful final check before committing:

```powershell
git diff --check
npm test
npm run check
```

For runtime or packaged skill changes, also run:

```powershell
npm run bundle:skill
npm run smoke:skill
```

For distributable skill output:

```powershell
npm run package:skill
```

## Agent Rule Of Thumb

If the problem is brand-specific, edit brand definitions and assets.

If the problem is component behaviour, edit parser, HTML renderer, PPTX renderer, tests, and docs together.

If the problem is skill usability, edit `SKILL.md` and `REFERENCE.md`.

If the problem is generated `tool/dist/`, fix source and rebuild. Do not patch the generated bundle by hand.
