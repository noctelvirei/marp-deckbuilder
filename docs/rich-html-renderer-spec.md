# Rich HTML Renderer Spec

This spec records the supplied demo as renderer-owned behavior. Authors write
Markdown and custom tags only. The renderer owns the generated HTML scaffolding,
theme CSS, JavaScript initializers, animation timing, print mode, and PDF-safe
fallbacks.

The source demo contains 19 rendered slides. Its numbering skips S12; this spec
keeps the demo numbering so audits can compare behavior directly.

## Runtime Contract

- All rich components compile from `deck-*` tags into generated HTML marked with
  `data-deck-rich`.
- The runtime initializes components from `src/rich-html-runtime.js` and exposes
  `window.deckRichHtml.initAll()`, `enterPrintMode()`, `exitPrintMode()`, and
  `snapAll()`.
- `beforeprint` enters print mode, initializes all rich components, snaps
  animations to their final state, hides interactive-only canvas where needed,
  and reveals static fallbacks.
- `afterprint` exits print mode.
- Agents must not author inline CSS or custom animation JavaScript for these
  effects. Brand teams customize palettes and background treatments through
  renderer theme variables, background assets, or runtime hooks.

## Component Mapping

| Demo | Public tag | Renderer CSS responsibility | Runtime responsibility | Print/PDF fallback |
| --- | --- | --- | --- | --- |
| S1 cinematic cover | `deck-rich-cover` | Full-slide dark cover, oversized hero type, highlighted title word, badge, canvas layer. | Canvas particle/link background with subtle motion. | Canvas hidden by print CSS; static gradient background and final typography remain. |
| S2 agenda | `deck-rich-agenda` with `deck-rich-item` | Large count block, numbered agenda rows, stagger-ready hidden state. | Add visible classes to agenda rows with staggered delays. | Rows snap visible with transitions disabled. |
| S3 statistics | `deck-rich-stats` or `deck-metric-rings` with `deck-rich-metric` | SVG ring layout, centered values, metric labels and card grid. | Animate ring stroke offsets and count values up. | Ring offsets and numeric values snap to final state. |
| S4 bar chart | `deck-rich-bars` with `deck-rich-series` | Axis grid, grouped bars, legend, final bar heights encoded in generated HTML. | Add animation class to scale bars from baseline with staggered delays. | Bars snap to full height. |
| S5 line chart | `deck-rich-line` with `deck-rich-series` | Generated SVG axes, grid, paths, areas, dots, and legend. | Draw paths and fills with stroke/opacity animation, then reveal dots. | Paths, areas, and dots snap visible. |
| S6 donut chart | `deck-rich-donut` with `deck-rich-segment` | SVG donut shell, segment elements, center total, legend bars. | Compute stroke dash arrays/offsets from segment values, animate bars and total count. | Segment strokes, legend bars, and total value compute synchronously before print. |
| S7 magazine flip | `deck-magazine-book` with `deck-magazine-page` | 3D book scene, fixed left cover, right page sheets, spine anchoring, page face styling, curl shadow, hint text, hidden print layout. | Click right half to rotate next sheet with `rotateY(-180deg)`, click left half to reverse, update z-index and next-page curl hint. | Hide 3D book and show flat `book-print` card grid with every page visible. |
| S8 timeline | `deck-rich-timeline` with `deck-rich-milestone` | Horizontal track, milestones, color accents, hidden milestone state. | Draw progress line and reveal milestones in sequence. | Progress line and milestones snap visible. |
| S9 tilt cards | `deck-tilt-cards` with `deck-rich-card` | Perspective card grid, hover highlight layer, compact card typography. | On pointer move, update rotateX/rotateY and radial highlight position; reset on leave. | Static card grid; no interaction required. |
| S10 typewriter | `deck-typewriter` with `deck-rich-phrase` | Typewriter text well, cursor, phrase dots, hidden print list. | Character reveal loop with phrase cycling and dot updates. | Hide animated output and show all phrases as a static list. |
| S11 particle network | `deck-particle-network` | Full-slide canvas behind centered narrative overlay and tag. | Canvas particles with proximity links and continuous motion. | Canvas hidden; static background and text remain. |
| S13 neon title | `deck-neon-title` with `deck-rich-item` | Neon title, glow panels, flicker and shadow keyframes. | CSS-owned animation; no JS required. | Glow remains static and printable. |
| S14 glass cards | `deck-glass-cards` with `deck-rich-card` | Translucent cards, blur, glowing borders, background light shapes. | CSS-owned hover/entrance behavior. | Solid dark cards replace translucent blur for print. |
| S15 radar chart | `deck-radar-chart` with `deck-rich-axis` | Radar SVG shell, grid groups, polygons, labels, side metric bars. | Build SVG polygons/axes/dots from tag data, animate polygon reveal and bars. | Build chart and snap polygons, dots, and bars visible. |
| S16 stagger grid | `deck-stagger-grid` with `deck-rich-card` | Dense feature grid with hidden card state and per-card delays. | Add visible class to every feature card. | Cards snap visible. |
| S17 comparison | `deck-comparison-reveal` with `deck-rich-column` and `deck-rich-row` | Comparison table grid, capability rows, yes/partial/no indicators. | Reveal comparison rows in sequence. | Rows snap visible. |
| S18 gauge | `deck-gauge` with `deck-rich-metric` | Semicircle gauge SVG, gradient arc, needle, numeric label, metric bars. | Animate arc offset, needle rotation, value count, and metric bars. | Gauge, needle, value, and bars snap to final state. |
| S19 reveal bridge | `deck-reveal-stack` | Large narrative lines, accent line, reveal bar. | Stage each line and divider into final visible state. | Lines and divider snap visible. |
| S20 close | `deck-rich-close` | Closing canvas slide, large title, subtitle, optional restart button. | Canvas network background and optional restart button behavior. | Canvas hidden; final closing text remains printable. |

## Public Child Tags

The renderer accepts these child tags only inside their matching parent:

| Child tag | Allowed parent tags |
| --- | --- |
| `deck-rich-item` | `deck-rich-agenda`, `deck-neon-title` |
| `deck-rich-card` | `deck-tilt-cards`, `deck-glass-cards`, `deck-stagger-grid` |
| `deck-rich-metric` | `deck-rich-stats`, `deck-metric-rings`, `deck-gauge` |
| `deck-rich-series` | `deck-rich-bars`, `deck-rich-line` |
| `deck-rich-segment` | `deck-rich-donut` |
| `deck-rich-milestone` | `deck-rich-timeline` |
| `deck-rich-phrase` | `deck-typewriter` |
| `deck-rich-axis` | `deck-radar-chart` |
| `deck-rich-column` | `deck-comparison-reveal` |
| `deck-rich-row` | `deck-comparison-reveal` |
| `deck-magazine-page` | `deck-magazine-book` |

## Showcase Fixture

`samples/rich-html-showcase.md` is the renderer-owned showcase. It may contain
content and rich custom tags, but no inline `<style>` or `<script>` blocks.
Build it with:

```powershell
node src/cli.js build samples/rich-html-showcase.md --html dist/rich-html-showcase.html --resources resources
```
