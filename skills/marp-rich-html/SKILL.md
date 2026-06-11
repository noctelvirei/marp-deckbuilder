---
name: marp-rich-html
description: Authors renderer-owned rich HTML presentation slides using custom tags only. Use when the user asks for cinematic covers, animated charts, magazine page flips, particle backgrounds, neon/glass effects, radar or gauge visuals, or the rich HTML showcase.
---

# Marp Rich HTML

Use this skill when a deck needs the renderer-owned rich HTML components. Write
Markdown custom tags and content only. The renderer owns CSS, JavaScript,
animation behavior, print mode, and PDF-safe fallbacks.

Build rich HTML decks with the `marp-deckbuilder` renderer. Do not hand-author
inline `<style>` blocks or custom animation `<script>` blocks for these effects.

## Workflow

1. Choose the rich component tag that matches the requested effect.
2. Author a Marp slide using that tag and its allowed child tags.
3. Keep the slide content compact and data-driven.
4. Build with the deckbuilder CLI or skill wrapper.
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
