---
name: marp-report
description: Builds single-page, scrollable, brandable HTML reports from Markdown using renderer-owned report layout and rich HTML effect tags. Use when the user asks for a report, findings document, written analysis, or print-to-PDF output rather than slides.
---

# Marp Report

Use this skill to turn source material into one long-form HTML report: a single
scrolling browser page designed for reading and Print to PDF. Use
`marp-deckbuilder` instead when the user asks for slides, a presentation, or
editable PPTX.

## Core Rule

Write `report.md` as Markdown plus renderer-owned component tags/classes. Do not
paste custom report CSS, layout scaffolds, CDN scripts, or chart initialization
JavaScript into the report source. The renderer owns the cover, report body
layout, table of contents, theme CSS, rich HTML effects, print behavior, and
offline vendor injection.

Reports do not create slides. Rich effect tags render as in-flow report blocks
inside one HTML page.

## Workflow

1. Read the source material and identify purpose, audience, period, source data,
   key findings, and required decisions.
2. Create one output folder for the request. Prefer
   `Documents/Presentations/YYYY-MM-DD/<report-title-slug>/` when the user has
   not specified a location.
3. Draft `report.md` with frontmatter, Markdown headings, prose, lists, and
   tables. Use `surface: dark` for the Lightico dark report look or omit it for
   the default light report.
4. Use renderer-owned rich tags for visual effects: metric rings, bar/line/donut
   charts, timelines, glass cards, radar charts, gauges, comparison reveals, and
   staged reveals. See `REFERENCE.md` when writing those tags.
5. Use small inline renderer classes only when Markdown cannot express the
   element, such as table status badges: `<span class="r-badge green">Active</span>`.
6. Build from this skill folder:

```bash
node scripts/build-report.mjs <output-folder>/report.md --out-dir <output-folder>
```

7. Return the generated `.html` and source `.md` paths. For PDF, tell the user to
   open the HTML and use browser Print to PDF.

## Authoring Guidance

- Write for a reader scrolling a document, not for a presenter advancing slides.
- Let headings create structure; the renderer builds a sticky table of contents
  when the report has enough sections.
- Prefer Markdown tables for detailed data.
- Prefer rich renderer tags over hand-built chart HTML.
- Keep rich visual blocks focused on the finding they support.
- Keep technical field names as plain text unless code formatting is truly
  useful.
- Do not use `deck-card-grid`, `deck-chart`, or other slide/PPTX components in
  reports. Report mode accepts the rich HTML effect tags only.
- Do not add `<style>` or `<script>` blocks to `report.md`.
- Do not use CDN URLs or external network assets.

## Build Output

`scripts/build-report.mjs` writes:

- `report.html`: self-contained report HTML with brand resources, renderer CSS,
  rich runtime, and offline vendor libraries inlined.
- `report.md`: unchanged source file.

The skill intentionally does not bundle a browser engine. PDF export is done
with browser Print to PDF.

See [REFERENCE.md](REFERENCE.md) for supported frontmatter, rich effect tags, and
small inline report classes.
