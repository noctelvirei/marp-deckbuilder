---
name: marp-rich-html
description: Authors renderer-owned rich HTML presentation slides using custom tags only. Use when the user asks for cinematic covers, animated charts, magazine page flips, particle backgrounds, neon/glass effects, radar or gauge visuals, or the rich HTML showcase.
---

# Marp Rich HTML

Use this baseline rich HTML skill when a deck needs the renderer-owned rich HTML
components. Write Markdown custom tags and content only. The renderer owns CSS,
JavaScript, animation behavior, print mode, and PDF-safe fallbacks.

Build rich HTML decks with the bundled renderer. Do not hand-author inline
`<style>` blocks or custom animation `<script>` blocks for these effects.

## Baseline Skill Contract

This is the `richhtml` baseline. Corporate agents should populate
`tool/resources/definitions/brand.json`, `tool/resources/definitions/theme.css`,
and `tool/resources/` with corporate palettes, backgrounds, logos, fonts, and
rich-effect assets. Preserve `tool/dist/`, `tool/resources/templates/`, and the
build wrapper from this upstream baseline.

The renderer owns logo placement and surface variants. Corporate logo is top
left; customer logo, when supplied by frontmatter, is top right. Authors should
reference one logical logo and let the renderer choose dark/light variants.

When importing this baseline over an older branded copy, clean out old upstream
runtime bundles first: remove the existing `tool/dist` directory, stale hashed
chunk files, and old extracted baseline files that are not private corporate
resources. Do not leave old and new renderer bundles side by side.

## Workflow

1. Choose the rich component tag that matches the requested effect.
2. Author a Marp slide using that tag and its allowed child tags.
3. Keep the slide content compact and data-driven.
4. Build from this skill folder:

```bash
node scripts/build-rich-html.mjs <output-folder>/deck.md --out-dir <output-folder>
```

5. Verify the HTML in a browser and check Print to PDF when the deck will be shared as PDF.

## Available Tags

- `deck-rich-cover`
- `deck-rich-agenda`
- `deck-rich-stats` and alias `deck-metric-rings`
- `deck-rich-bars`
- `deck-rich-line`
- `deck-rich-donut`
- `deck-magazine-book`
- `deck-rich-timeline`
- `deck-tilt-cards`
- `deck-typewriter`
- `deck-particle-network`
- `deck-neon-title`
- `deck-glass-cards`
- `deck-radar-chart`
- `deck-stagger-grid`
- `deck-comparison-reveal`
- `deck-gauge`
- `deck-reveal-stack`
- `deck-rich-close`

See `REFERENCE.md` for exact attributes, child tags, and examples.

## Brand Customization

Brand teams customize palettes, background assets, and canvas/SVG treatment
through renderer theme variables, resource definitions, and runtime hooks. Agents
should not paste brand CSS or effect JavaScript into deck Markdown.
