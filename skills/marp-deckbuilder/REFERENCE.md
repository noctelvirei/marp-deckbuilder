# Marp Deckbuilder Reference

## Build Commands

From the skill folder:

```bash
node scripts/build-deck.mjs examples/example.md --out-dir output
```

Equivalent direct CLI call:

```bash
node tool/dist/deckbuilder.mjs build deck.md --html output/deck.html --pptx output/deck.pptx --mode native --resources tool/resources
```

The skill runs the bundled renderer and does not install dependencies.

The generated HTML uses vendored Marp CLI/Bespoke presenter assets from
`tool/resources/templates/`, including the on-screen controls, overview mode,
presenter view, keyboard/touch/wheel navigation, and fullscreen behavior.

Visible slide numbers are off by default. Add `paginate: true` to deck
frontmatter only when the user explicitly wants pagination on every slide.

When writing an HTML file, the renderer inlines every used `resource:` asset as a
`data:` URL by default. The HTML is self-contained, which works best in Claude
Desktop chats and artifact previews. Authors should still reference assets with
`resource:`; do not paste brand SVGs or backgrounds into deck Markdown by hand.

If `tool/resources/definitions/brand.json` declares `assets.backgrounds`, those
background images are applied to HTML automatically and embedded into the HTML
as `data:` URLs. The same declarations drive PPTX slide backgrounds.
If it declares `assets.logo`, the renderer positions the company logo from
`layouts.companyLogo` (or legacy `layouts.logo`) and embeds it into HTML/PPTX.
Customer logos come from deck frontmatter and are positioned from
`layouts.customerLogo`.

Use `--html-assets copy` only when you explicitly want a sibling `resources/`
folder beside the HTML. That output shape looks like:

```text
Documents/Presentations/2026-05-21/example-deck/
  deck.md
  deck.html
  deck.pptx
  resources/
    brand-logo-light.svg
    brand-title-bg.png
    icons/
      utility-analytics-chart.svg
```

Keep the HTML file and its sibling `resources/` folder together when sharing or
moving a deck generated with `--html-assets copy`.

## Fail-Fast Contract

The renderer validates the Markdown before it writes output. It should never
quietly strip a component, leave an empty card, or ignore a missing file. A bad
deck should fail with an error the agent can fix.

Builds fail for:

- unknown `deck-*` tags, such as `<deck-cardd>`;
- mismatched or unclosed `deck-*` tags;
- child components in the wrong parent;
- empty structured components, such as `deck-card-grid` without `deck-card`;
- invalid charts, including missing labels/values, non-numeric values, or a
  labels/values count mismatch;
- any referenced image/resource that cannot be found under `tool/resources/`;
- any referenced image/resource that tries to resolve outside `tool/resources/`.

The error includes the slide number for component syntax errors. Resource errors
include the missing reference and the candidate file paths the renderer checked.

## Resource And Image Resolution

All deck assets are resolved dynamically from `tool/resources/`; the renderer has
no hardcoded list of approved image names.

Supported image extensions for extensionless lookup:

- `.svg`
- `.png`
- `.jpg`
- `.jpeg`
- `.webp`
- `.gif`

Supported reference forms:

```md
resource:logos/customer.svg
logos/customer.svg
icons/face-scan.svg
```

For card icons, this shorthand is preferred:

```md
<deck-card title="Face scan" icon="face-scan">
  Capture identity evidence.
</deck-card>
```

`icon="face-scan"` resolves as `resource:icons/face-scan`, then the renderer
looks for `face-scan.svg`, `face-scan.png`, `face-scan.jpg`, and the other
supported extensions in `tool/resources/icons/`.

For non-card images, use an explicit resource path:

```md
<img src="resource:screenshots/workflow.png" alt="Workflow screenshot">
<deck-logo name="Example Bank" image="resource:logos/example-bank.svg"></deck-logo>
<deck-proof logo="resource:logos/example-bank.svg" customer="Example Bank"></deck-proof>
```

Raw HTML `<img>` tags with local paths are normalized into resources before
rendering. For example, `<img src="screenshots/demo.png">` resolves against
`tool/resources/screenshots/demo.png`. Remote HTTP images and arbitrary local
file URLs are not supported because the generated HTML/PPTX should be portable
and self-contained.

When writing HTML, used resources are embedded as `data:` URLs by default. When
writing PPTX, supported SVG/PNG/JPEG/WEBP/GIF files are inserted into the slide
deck. If a referenced file is absent, the build fails.

## Brand Chrome And Slide Surfaces

The renderer owns theme, backgrounds, and logo placement. Do not hand-write
company logos, customer logo positioning, global Marp theme names, or background
CSS in `deck.md`.

Surface is independent of layout. Choose it deliberately:

- cover, divider, and close slides are dark;
- content/component slides are light by default for backward compatibility;
- `defaultSurface: dark` or `defaultSurface: light` in frontmatter sets the deck-wide default for non-cover slides;
- `<!-- surface: dark -->` and `<!-- surface: light -->` override one slide;
- `surface="dark"` or `surface="light"` on an executive component controls that slide.

Do not encode a rule such as "dark headers, white content." The executive style
has both dark and light versions; use the surface that matches the deck.

The configured brand theme wins over any stale `theme:` value in deck
frontmatter. Authors should usually omit `marp:` and `theme:` entirely.

Customer logo frontmatter:

```yaml
---
title: Partnership update
customerLogo: resource:logos/hsbc.svg
customerName: HSBC
---
```

Nested customer metadata is also accepted:

```yaml
---
customer:
  name: HSBC
  logo: resource:logos/hsbc.svg
---
```

The company logo is always the brand logo and is placed top left. The customer
logo, when present, is placed top right. These slots are applied to both HTML and
PPTX output. For compatibility, the parser can extract
`<img class="deck-customer-logo" ...>` from a slide, but new decks should prefer
frontmatter metadata so the logo is not repeated on every slide.

Customer logos are arbitrary third-party assets. On dark slides, the renderer
places them on a white chip/backplate so transparent SVG/PNG logos remain
visible without changing the customer's brand colours. Do not use CSS inversion
filters for customer logos.

Recommended brand asset contract:

```json
{
  "assets": {
    "backgrounds": {
      "cover": "resource:brand-title-bg.png",
      "divider": "resource:brand-title-bg.png",
      "close": "resource:brand-title-bg.png",
      "content": "resource:brand-content-bg.png",
      "light": "resource:brand-light-bg.png"
    },
    "logo": {
      "dark": "resource:brand-logo-blue-white.svg",
      "light": "resource:brand-logo-blue-black.svg"
    }
  },
  "layouts": {
    "companyLogo": { "x": 36, "y": 21, "w": 98, "h": 24 },
    "customerLogo": { "x": 828, "y": 21, "w": 98, "h": 24 }
  }
}
```

If a branded fork only has the legacy `assets.logo.default` and `layouts.logo`,
the renderer still uses those values. Add `logo.light` and `logo.dark` when the
brand needs different wordmarks on white vs dark pages.

## Component Contract

Use only these structured components when you need native PPTX output:

| Component | Required shape | Optional fields | Output |
| --- | --- | --- | --- |
| `deck-divider` | `title` attribute or `h1` child | `act`, `label`, `subtitle` | Full divider slide |
| `deck-stat-grid` | one or more direct `deck-stat` children | each stat can use `value`/`label` attributes or text children | 3-up KPI row |
| `deck-card-grid` | one or more direct `deck-card` children | `columns="3"` or `columns="4"` | 3/4 card layout |
| `deck-card` | title/body/media | `title`, `header`, `icon`, `icon-alt`, `image`, `src`, `image-alt`, `alt` | Card in grid |
| `deck-chart` | matching `labels` and `values` attributes | `title`, `series`, `type="bar"` or `type="line"` | Editable PPTX chart and HTML chart |
| `deck-visual` | inline SVG or fallback text | `title`, `caption`, `alt`, `fallback` | Inline SVG in HTML, embedded SVG image in PPTX |
| `deck-comparison` | `rows="left|right;..."` or direct `deck-row` children | `columns`, `left-title`, `right-title`, `left`, `right`, `title` | Comparison table |
| `deck-row` | inside `deck-comparison` | `label`, `left`, `right` | Comparison row |
| `deck-swimlane` | one or more direct `deck-lane` children | | Swimlane slide |
| `deck-lane` | inside `deck-swimlane`, one or more direct `deck-step` children | `title`, `label`, `color="blue|cyan|purple|green|red|orange"` | Swimlane lane |
| `deck-next-steps` | one or more direct `deck-step` children | | Numbered action list |
| `deck-step` | inside `deck-lane` or `deck-next-steps` | `title`, body text | Step/action item |
| `deck-proof` | one or more `deck-stat` children or proof text | `customer`, `logo`, `logo-name`, `bridge`, `source` | Proof slide |
| `deck-logo-wall` | one or more direct `deck-logo` children | `title` | Logo grid |
| `deck-logo` | inside `deck-logo-wall` | `name`, `image`, `src` | Logo tile, or text tile if no image is supplied |
| `deck-exec-title` | `title` attribute or `h1` child | `eyebrow`, `subtitle`, `accent`, `surface="dark|light"` | Executive chapter/title slide |
| `deck-exec-rows` | one or more direct `deck-exec-row` children | `side-title`, `side-value`, `side-body`, `takeaway`, `surface="dark|light"` | CEO-style row stack with optional side callout |
| `deck-exec-row` | inside `deck-exec-rows` | `label`, `kicker`, `title`, `body`, `note`, `accent` | Large row item |
| `deck-exec-cards` | one or more direct `deck-exec-card` children | `columns="2|3|4"`, `variant`, `intro`, `target`, `takeaway`, `surface="dark|light"` | Large card/grid/vector slide |
| `deck-exec-card` | inside `deck-exec-cards` | `label`, `title`, `metric`, `subtitle`, `body`, `accent` | Large executive card |
| `deck-exec-timeline` | one or more direct `deck-exec-milestone` children | `takeaway`, `surface="dark|light"` | Three-milestone timeline |
| `deck-exec-milestone` | inside `deck-exec-timeline` | `year`, `title`, `body`, `accent` | Timeline milestone |
| `deck-exec-metrics` | direct `deck-exec-metric` and/or `deck-exec-panel` children | `section-title`, `takeaway`, `surface="dark|light"` | Metric row plus optional panels |
| `deck-exec-metric` | inside `deck-exec-metrics` | `value`, `label`, `accent` | Large metric tile |
| `deck-exec-panel` | inside `deck-exec-metrics` | `value`, `title`, `body`, `note`, `accent` | Large detail panel |
| `deck-takeaway` | `text` attribute or text body | | Takeaway bar |
| `deck-close` | `title` attribute or `h1` child | `name`, `role` | Closing slide |

Native PPTX rendering intentionally caps some repeated content so slides remain
usable:

- `deck-stat-grid`: first 3 stats.
- `deck-card-grid`: first 4 cards; `columns="3"` and `columns="4"` are the supported layouts.
- `deck-comparison`: first 6 rows.
- `deck-swimlane`: first lanes that fit the brand layout (usually 2, or 3 when `layouts.swimlane.laneY` has 3 entries), first 5 steps per lane; lane colors are `blue`, `cyan`, `purple`, `green`, `red`, and `orange`.
- `deck-proof`: first 3 stats.
- `deck-next-steps`: first 3 steps.
- `deck-logo-wall`: first 12 logos.

The HTML output can visually carry more in some layouts, but authors should stay
inside those limits when the PPTX handoff matters.

The PPTX renderer clamps component text boxes inside their filled shapes. If
copy still feels crowded, that is a deck-design signal: shorten the copy, split
the finding across multiple cards/slides, or move detail into speaker notes.

Parent/child rules are strict:

- `deck-card` must be directly inside `deck-card-grid`.
- `deck-stat` must be directly inside `deck-stat-grid` or `deck-proof`.
- `deck-row` must be directly inside `deck-comparison`.
- `deck-lane` must be directly inside `deck-swimlane`.
- `deck-step` must be directly inside `deck-lane` or `deck-next-steps`.
- `deck-logo` must be directly inside `deck-logo-wall`.
- `deck-exec-row` must be directly inside `deck-exec-rows`.
- `deck-exec-card` must be directly inside `deck-exec-cards`.
- `deck-exec-milestone` must be directly inside `deck-exec-timeline`.
- `deck-exec-metric` and `deck-exec-panel` must be directly inside `deck-exec-metrics`.

## Slide Directives

Supported HTML/PPTX split directives:

```md
<!-- pptx: skip -->
<!-- pptx-skip: true -->
<!-- html-only: true -->

<!-- html: skip -->
<!-- html-skip: true -->
<!-- pptx-only: true -->
```

Use the first group for browser-only slides, usually JavaScript, complex HTML, or
interactive demos. Use the second group for simple editable PPTX fallback slides
that should not appear in the HTML presentation.

Other supported directives:

```md
<!-- _class: cover -->
<!-- _class: light -->
<!-- _class: dark -->
<!-- surface: light -->
<!-- surface: dark -->
<!-- title: Override title -->
<!-- subtitle: Override subtitle -->
<!-- eyebrow: Section label -->
<!-- takeaway: Bottom bar text -->
<!-- footnote: Footnote text -->
```

Prefer component attributes over directives when a component has an explicit
field for the same thing.

## Component Syntax

### Divider

```md
<deck-divider label="Context" title="The Moment." subtitle="A short transition line."></deck-divider>
```

Use `act="ACT 01"` only when the source material intentionally uses an act or
play structure. For business decks, prefer `label` with a plain section name or
omit the label.

### Stats

```md
<deck-stat-grid>
  <deck-stat value="42%" label="manual handoffs"></deck-stat>
  <deck-stat value="3.8 days" label="average completion time"></deck-stat>
  <deck-stat value="27%" label="rework rate"></deck-stat>
</deck-stat-grid>
```

### Cards

```md
<deck-card-grid columns="3">
  <deck-card title="Intake" icon="utility-intake"><p>Standardize required data capture.</p></deck-card>
  <deck-card title="Evidence"><p>Replace attachment loops.</p></deck-card>
  <deck-card title="Approval"><p>Route decisions through a visible flow.</p></deck-card>
</deck-card-grid>
```

Cards can reference images without raw HTML. `icon="face-scan"` resolves to
`tool/resources/icons/face-scan.svg` (or another supported image extension if
present). `image="diagrams/process.png"` and `src="resource:diagrams/process.png"`
resolve against `tool/resources/`. Missing referenced files fail the build with
an explicit error instead of producing empty cards or broken images.

Supported card media combinations:

```md
<!-- Preferred icon shorthand: resolves tool/resources/icons/product-face-scan.svg -->
<deck-card title="Face Scan" icon="product-face-scan">
  Capture identity evidence.
</deck-card>

<!-- Icon with explicit alt text -->
<deck-card title="Face Scan" icon="product-face-scan" icon-alt="Face scan icon">
  Capture identity evidence.
</deck-card>

<!-- Full image path under tool/resources/ -->
<deck-card title="Dashboard" image="screenshots/dashboard.png">
  Show the operating view.
</deck-card>

<!-- Explicit resource URL, useful when the path contains a folder -->
<deck-card title="Evidence" src="resource:icons/evidence-check.svg">
  Replace attachment loops.
</deck-card>

<!-- Raw img child is accepted, but attributes are preferred -->
<deck-card title="Signed pack">
  <img src="resource:icons/signed-pack.svg" alt="Signed pack">
  Complete the pack in-session.
</deck-card>
```

### Chart

```md
<deck-chart
  type="bar"
  title="Average completion time"
  series="Days"
  labels="Digital, Branch, Contact centre"
  values="2.1, 3.8, 4.6"
></deck-chart>
```

Supported chart types: `bar`, `line`.

### Visual SVG

Use `deck-visual` for rich charts, diagrams, maps, and dashboard panels that should stay visually identical between HTML and PPTX without asking the agent to build hundreds of PowerPoint shapes. The HTML output keeps the SVG inline. The PPTX output embeds the SVG as a crisp visual image, so it is not shape-editable in PowerPoint; edit the source Markdown/SVG and rebuild. Put essential fills, strokes, fonts, labels, and dimensions inside the SVG because PPTX receives only the SVG content.

```md
<deck-visual title="Scenario operating model" caption="Embedded as SVG in PPTX.">
  <svg viewBox="0 0 920 360" role="img" aria-label="Scenario operating model">
    <rect x="18" y="18" width="884" height="324" fill="#fdfdfd" stroke="#dedede"/>
    <text x="50" y="64" font-family="Poppins, Aptos, sans-serif" font-size="24" font-weight="500">Workstream impact</text>
    <rect x="178" y="104" width="250" height="18" fill="#eef6fe"/>
    <rect x="178" y="104" width="210" height="18" fill="#0f82f5"/>
    <text x="446" y="120" font-family="Poppins, Aptos, sans-serif" font-size="15" font-weight="500">84</text>
  </svg>
</deck-visual>
```

### Comparison

```md
<deck-comparison left-title="Internal build" right-title="Deckbuilder">
  <deck-row label="Timeline" left="12-18 months" right="6-8 weeks"></deck-row>
  <deck-row label="Maintenance" left="Internal ownership" right="Platform updates"></deck-row>
</deck-comparison>
```

Compact two-column syntax is also supported:

```md
<deck-comparison
  columns="Bad assumption,Correct workflow"
  rows="Count status = created|Count cases first;Trust first result|Cross-check edge cases">
</deck-comparison>
```

### Swimlane

```md
<deck-swimlane>
  <deck-lane title="HR onboarding" color="blue">
    <deck-step title="Invite"><p>Send secure journey link.</p></deck-step>
    <deck-step title="Capture"><p>Collect evidence.</p></deck-step>
  </deck-lane>
  <deck-lane title="Auto finance" color="purple">
    <deck-step title="Start"><p>Trigger dealer workflow.</p></deck-step>
    <deck-step title="Sign"><p>Capture e-signature.</p></deck-step>
  </deck-lane>
</deck-swimlane>
```

### Proof

```md
<deck-proof
  customer="Example Bank"
  bridge="Prospect relevance: the same controls apply to high-volume onboarding journeys."
  source="Source: sample operating metrics, May 2026"
>
  <deck-stat value="55%" label="less manual handling"></deck-stat>
  <deck-stat value="2.4x" label="faster completion"></deck-stat>
  <deck-stat value="31%" label="fewer follow-ups"></deck-stat>
  <p>Context paragraph explaining why the proof matters.</p>
</deck-proof>
```

### Logo Wall

```md
<deck-logo-wall>
  <deck-logo name="Bank A" image="resource:logos/bank-a.png"></deck-logo>
  <deck-logo name="Auto Finance Co."></deck-logo>
</deck-logo-wall>
```

Images resolve against `tool/resources/`. If `image`/`src` is supplied and the
file is missing, the build fails. If no image is supplied, the logo tile renders
as editable text using `name`.

### Executive Title

Use for CEO-style chapter openers with oversized type. Set the surface
deliberately; dark and light use the same geometry.

```md
<!-- surface: dark -->

<deck-exec-title
  eyebrow="What's next"
  title="From momentum to plan."
  subtitle="The growth vectors, the investment plan"
  accent="red"
></deck-exec-title>
```

Light version:

```md
<deck-exec-title
  surface="light"
  eyebrow="Investor update"
  title="Scaling with precision."
  subtitle="Building the AI runtime for enterprise customer journeys."
></deck-exec-title>
```

### Executive Rows

Use for the wide row-stack pattern with optional side callout and takeaway.
Good for strategy shifts, layers, product architecture, and go-to-market
motions.

```md
<deck-exec-rows
  surface="dark"
  side-title="Why now"
  side-value="3"
  side-body="Compounding shifts moving the company from product vendor to enterprise infrastructure."
  takeaway="Each shift compounds the others — focus enables value, value justifies the runtime."
  takeaway-accent="red"
>
  <deck-exec-row label="01" kicker="Focus" title="Enterprise-only" body="Concentrated on Tier-1 banks, telcos, and global insurers." accent="yellow" note="→ p.8"></deck-exec-row>
  <deck-exec-row label="02" kicker="Value" title="Measurable ROI" body="Selling outcomes — completion, conversion, time-to-revenue — not seats or features." accent="yellow" note="→ p.9"></deck-exec-row>
  <deck-exec-row label="03" kicker="Architecture" title="Runtime infrastructure" body="From point tooling to the always-on layer powering enterprise customer journeys." accent="yellow" note="→ p.10"></deck-exec-row>
</deck-exec-rows>
```

### Executive Cards

Use for three/four large cards, capability loops, and growth-vector cards. Use
`columns="4"` for value loops, `columns="3"` for vector cards, and `columns="2"`
for 2×2 grids.

```md
<deck-exec-cards
  surface="light"
  columns="3"
  target="[Target ARR] · 2027"
  target-accent="yellow"
>
  <deck-exec-card label="01" title="Expansion" metric="[NRR%]" subtitle="Net Revenue Retention" body="Existing enterprise base expands faster than churn."></deck-exec-card>
  <deck-exec-card label="02" title="New Logos" metric="[New-logo ARR target]" body="Tier-1 wins in financial services, telco, and auto financial."></deck-exec-card>
  <deck-exec-card label="03" title="AI Premium" metric="2×" subtitle="Price per transaction" body="AI-tier SKUs price at 2× standard Lightico."></deck-exec-card>
</deck-exec-cards>
```

### Executive Timeline

```md
<deck-exec-timeline
  surface="dark"
  takeaway="Three consecutive years of disciplined growth — now compounding into AI-led acceleration."
>
  <deck-exec-milestone year="2023" title="Foundation" body="Strategic acquisition; shifted to enterprise-only." accent="blue"></deck-exec-milestone>
  <deck-exec-milestone year="2024" title="Expansion" body="Created a sharp, focused enterprise program." accent="blue"></deck-exec-milestone>
  <deck-exec-milestone year="2025" title="AI Inflection" body="Launched first AI-native solutions for risk management and fraud prevention." accent="yellow"></deck-exec-milestone>
</deck-exec-timeline>
```

### Executive Metrics

Use for top metric rows with supporting panels.

```md
<deck-exec-metrics
  surface="dark"
  section-title="Allocation"
  takeaway="All four signals point to a step-change — not incremental growth."
>
  <deck-exec-metric value="[Deal Size Growth]" label="Average Deal Size"></deck-exec-metric>
  <deck-exec-metric value="[2×]" label="AI Price per Transaction"></deck-exec-metric>
  <deck-exec-panel value="[GM%]" title="Gross Margin (2026)" body="Software economics holding through AI scale-up."></deck-exec-panel>
  <deck-exec-panel value="[AI ARR%]" title="AI Share of ARR" body="AI-tier transactions drive higher revenue per deal." accent="yellow"></deck-exec-panel>
</deck-exec-metrics>
```

## Generated HTML Classes

The component compiler emits these stable CSS classes for theme authors:

| Component | Generated classes |
| --- | --- |
| `deck-stat-grid` | `stat-grid`, `stat-card` |
| `deck-card-grid` | `card-grid`, `three`, `four`, `deck-card-media`, `deck-card-icon`, `deck-card-image` |
| `deck-chart` | `deck-chart`, `deck-chart-bar`, `deck-chart-line`, `deck-chart-row`, `deck-chart-label`, `deck-chart-track`, `deck-chart-fill` |
| `deck-visual` | `deck-visual`, `deck-visual-stage`, `deck-visual-caption` |
| `deck-comparison` | `deck-comparison`, `negative`, `positive` |
| `deck-swimlane` | `deck-swimlane`, `deck-lane`, `deck-lane-<color>`, `deck-lane-steps`, `deck-arrow` |
| `deck-proof` | `deck-proof`, `deck-proof-logo`, `deck-proof-context`, `deck-proof-bridge`, `deck-proof-source` |
| `deck-next-steps` | `deck-next-steps` |
| `deck-logo-wall` | `deck-logo-wall`, `deck-logo-grid`, `deck-logo-tile` |
| `deck-exec-title` | `deck-exec`, `deck-exec-title`, `deck-exec-eyebrow`, `deck-exec-subtitle`, optional `deck-exec-surface-light` |
| `deck-exec-rows` | `deck-exec`, `deck-exec-rows`, `deck-exec-row-stack`, `deck-exec-row`, `deck-exec-side`, `deck-exec-takeaway` |
| `deck-exec-cards` | `deck-exec`, `deck-exec-cards`, `deck-exec-card-grid`, `deck-exec-card`, `deck-exec-target`, `deck-exec-takeaway` |
| `deck-exec-timeline` | `deck-exec`, `deck-exec-timeline`, `deck-exec-timeline-line`, `deck-exec-timeline-item`, `deck-exec-takeaway` |
| `deck-exec-metrics` | `deck-exec`, `deck-exec-metrics`, `deck-exec-metric-row`, `deck-exec-metric`, `deck-exec-panel-grid`, `deck-exec-panel`, `deck-exec-takeaway` |
| `deck-divider` | `deck-divider`, plus slide class `deck-divider-slide` |
| `deck-close` | `deck-close`, plus slide class `deck-close-slide` |
| `deck-takeaway` | `takeaway` |

Theme CSS may style these classes. Deck Markdown should normally use the
components, not hand-authored generated class names, unless building a premium
HTML-only slide.

### Next Steps

```md
<deck-next-steps>
  <deck-step title="Confirm the target journey"><p>Pick one measurable process.</p></deck-step>
  <deck-step title="Map evidence and controls"><p>List documents and approvals.</p></deck-step>
  <deck-step title="Run a governed pilot"><p>Prove speed and control quality.</p></deck-step>
</deck-next-steps>
```

### Close

```md
<deck-close title="Thank you" name="Jane Smith" role="VP Solutions"></deck-close>
```

## HTML Premium Slides

HTML is the high-fidelity presentation format. Use raw HTML, inline SVG, and scoped CSS for slides that should feel more like a polished data story than a standard PowerPoint page. Keep the source compact enough that the user can ask Claude to change the data, labels, or emphasis.

Use `deck-visual` when a rich SVG should also land in PPTX as a faithful visual. Use `deck-chart`, `deck-stat-grid`, `deck-card-grid`, or the other structured components when PowerPoint editability matters more than exact visual fidelity.

For analytics, research, customer, and executive decks, do not default to a lowest-common-denominator slide. Make the HTML version the premium presentation: at least one main insight should use a richer HTML/SVG/JS treatment than the editable PPTX fallback.

The build wrapper injects Chart.js, Observable Plot, and D3 into the generated HTML head from local vendor files. Do not include CDN `<script src>` tags and do not paste minified library source into Markdown.

| Library | Use for |
| --- | --- |
| Chart.js | Bar, stacked bar, line, doughnut, and dashboard-style canvas charts |
| Observable Plot | Dot plots, area charts, heatmaps, distributions, and small multiples |
| D3 | Treemaps, custom arcs, force layouts, bespoke SVG charts |

### Split HTML/PPTX Slides

Use paired slides when the HTML version should be richer than PowerPoint can sensibly edit:

- `<!-- pptx: skip -->` keeps a premium HTML/browser slide out of the PPTX.
- `<!-- html: skip -->`, `<!-- html-skip: true -->`, or `<!-- pptx-only: true -->` keeps the editable fallback out of the HTML deck.

```md
<!-- pptx: skip -->

# Portfolio concentration

<style scoped>
.signal { display:grid; grid-template-columns:1fr 1.2fr; gap:28px; align-items:center; }
.callout { padding:24px; border:1px solid #1e3a5f; background:#0d1d36; }
.callout strong { display:block; color:#0f82f5; font-size:58px; line-height:1; }
</style>

<div class="signal">
  <div class="callout"><strong>97%</strong><span>from the top two clients</span></div>
  <svg viewBox="0 0 560 280" role="img" aria-label="Annotated concentration chart">
    <rect x="18" y="42" width="470" height="44" fill="#071228"/>
    <rect x="18" y="42" width="305" height="44" fill="#0f82f5"/>
    <text x="18" y="32" fill="#c8d8f0" font-size="18">TD</text>
    <text x="338" y="71" fill="#ffffff" font-size="18">65%</text>
    <rect x="18" y="124" width="470" height="44" fill="#071228"/>
    <rect x="18" y="124" width="150" height="44" fill="#5143d5"/>
    <text x="18" y="114" fill="#c8d8f0" font-size="18">HSBC-RBWM</text>
    <text x="184" y="153" fill="#ffffff" font-size="18">32%</text>
  </svg>
</div>

---

<!-- html: skip -->

# Portfolio concentration

<deck-chart
  type="bar"
  title="Client volume split"
  labels="TD, HSBC-RBWM, Other active"
  values="77951, 38749, 3181"
></deck-chart>
```

### Browser-Only JavaScript

Use `<!-- pptx: skip -->` for slides that rely on browser JavaScript, animation loops, DOM updates, embedded demos, or other behavior PowerPoint cannot run. The HTML output keeps the slide and script. The PPTX output omits the slide instead of attempting a low-quality static reconstruction.

`<!-- html-only: true -->` and `<!-- pptx-skip: true -->` are accepted aliases for skipping PPTX output.

```md
<!-- pptx: skip -->

# Journey volume

<style scoped>
.chart-layout { display:grid; grid-template-columns:1fr 2fr; gap:32px; align-items:center; }
.stat-callout { padding:24px; border:1px solid #1e3a5f; background:#0d1d36; border-radius:6px; }
.stat-callout strong { display:block; font-size:58px; font-weight:300; color:#0f82f5; line-height:1; }
.stat-callout span { color:#8b9ab5; font-size:13px; }
</style>

<div class="chart-layout">
  <div class="stat-callout"><strong>77,951</strong><span>Total cases</span></div>
  <div style="position:relative;height:320px">
    <canvas id="journeyVol" role="img" aria-label="Cases by journey"></canvas>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  new Chart(document.getElementById('journeyVol'), {
    type: 'bar',
    data: {
      labels: ['J0107', 'J0106', 'J0101', 'J0116'],
      datasets: [{
        data: [52208, 11119, 8648, 3751],
        backgroundColor: ['#0f82f5', '#59d6fd', '#5143d5', '#f99358'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b9ab5' }, grid: { color: 'rgba(30,58,95,.5)' } },
        y: { ticks: { color: '#8b9ab5', callback: v => v.toLocaleString() }, grid: { color: 'rgba(30,58,95,.5)' } }
      }
    }
  });
});
</script>
```

If the PowerPoint audience still needs context, add a normal editable summary slide immediately after the browser-only slide.

```md
<!-- html: skip -->

# Journey volume

<deck-chart
  type="bar"
  title="Cases by journey"
  labels="J0107, J0106, J0101, J0116"
  values="52208, 11119, 8648, 3751"
></deck-chart>
```

### SVG Metric Dashboard

```md
<!-- pptx: skip -->

<style scoped>
.metric-board { display:grid; grid-template-columns:1fr 1fr; gap:28px; }
.metric-card { padding:26px; border:1px solid #1e3a5f; background:#0d1d36; border-radius:6px; }
.metric-card strong { display:block; color:#0f82f5; font-size:52px; line-height:1; }
.metric-card span { color:#c8d8f0; font-size:16px; }
</style>

# Operating signal

<div class="metric-board">
  <div class="metric-card"><strong>92%</strong><span>completed within SLA</span></div>
  <svg viewBox="0 0 520 220" role="img" aria-label="Weekly trend">
    <polyline fill="none" stroke="#0f82f5" stroke-width="8" points="24,170 130,142 236,151 342,96 496,54"/>
    <g fill="#c8d8f0">
      <text x="24" y="204">W1</text><text x="130" y="204">W2</text><text x="236" y="204">W3</text><text x="342" y="204">W4</text><text x="472" y="204">W5</text>
    </g>
  </svg>
</div>
```

### Annotated Funnel

```md
<!-- pptx: skip -->

<style scoped>
.funnel { display:grid; gap:12px; margin-top:24px; }
.stage { display:grid; grid-template-columns:180px 1fr 90px; align-items:center; gap:16px; }
.bar { height:34px; background:rgba(30,58,95,.65); border-radius:4px; overflow:hidden; }
.bar span { display:block; height:100%; background:#0f82f5; }
.stage strong, .stage b { color:#c8d8f0; }
</style>

# Conversion funnel

<div class="funnel">
  <div class="stage"><strong>Invited</strong><div class="bar"><span style="width:100%"></span></div><b>8,420</b></div>
  <div class="stage"><strong>Started</strong><div class="bar"><span style="width:78%"></span></div><b>6,568</b></div>
  <div class="stage"><strong>Completed</strong><div class="bar"><span style="width:61%"></span></div><b>5,136</b></div>
</div>
```

### Journey Map

```md
<!-- pptx: skip -->

<style scoped>
.journey { display:grid; grid-template-columns:repeat(5, 1fr); gap:14px; margin-top:34px; }
.journey article { min-height:160px; padding:18px; border:1px solid #1e3a5f; border-top:5px solid #0f82f5; background:#0d1d36; border-radius:6px; }
.journey small { color:#0f82f5; font-weight:500; }
.journey h2 { color:#ffffff; }
.journey p { color:#c8d8f0; }
</style>

# Customer journey

<div class="journey">
  <article><small>01</small><h2>Invite</h2><p>Start the secure journey.</p></article>
  <article><small>02</small><h2>Capture</h2><p>Collect evidence and consent.</p></article>
  <article><small>03</small><h2>Review</h2><p>Check completeness.</p></article>
  <article><small>04</small><h2>Resolve</h2><p>Fix exceptions.</p></article>
  <article><small>05</small><h2>Approve</h2><p>Close the case.</p></article>
</div>
```

### Observable Plot Heatmap

```md
<!-- pptx: skip -->

# Activity heatmap

<div id="activityHeatmap"></div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const data = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  for (const day of days) {
    for (let hour = 8; hour <= 18; hour += 1) {
      data.push({ day, hour, volume: Math.round(40 + Math.random() * 120) });
    }
  }
  const chart = Plot.plot({
    width: 760,
    height: 280,
    style: { background: 'transparent', color: '#c8d8f0', fontFamily: 'Poppins,sans-serif' },
    x: { label: 'Hour' },
    y: { label: null, domain: days },
    color: { scheme: 'blues' },
    marks: [Plot.cell(data, { x: 'hour', y: 'day', fill: 'volume', inset: 1 })]
  });
  document.getElementById('activityHeatmap').append(chart);
});
</script>
```

### D3 Treemap

```md
<!-- pptx: skip -->

# Portfolio treemap

<div id="portfolioTreemap"></div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const raw = [
    { name: 'J0107', value: 52208 },
    { name: 'J0106', value: 11119 },
    { name: 'J0101', value: 8648 },
    { name: 'J0116', value: 3751 }
  ];
  const colours = ['#0f82f5', '#59d6fd', '#5143d5', '#f99358'];
  const width = 760;
  const height = 320;
  const root = d3.hierarchy({ children: raw }).sum(d => d.value);
  d3.treemap().size([width, height]).padding(3)(root);
  const svg = d3.select('#portfolioTreemap').append('svg').attr('width', width).attr('height', height);
  const cell = svg.selectAll('g').data(root.leaves()).join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);
  cell.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', (_, i) => colours[i % colours.length])
    .attr('rx', 4);
  cell.append('text')
    .attr('x', 8)
    .attr('y', 22)
    .attr('fill', '#ffffff')
    .attr('font-size', 14)
    .attr('font-family', 'Poppins,sans-serif')
    .text(d => d.data.name);
});
</script>
```

### Premium Slide Safety

- Do not use CDN `<script src>` tags. The build wrapper injects bundled libraries.
- Do not paste minified JS libraries into Markdown.
- Do not use em dashes or double-hyphen separators in JavaScript comments.
- Keep dark slides dark: avoid light SVG backgrounds and near-black chart text.
- Keep a PPTX fallback when the point needs to survive outside the HTML deck.

## Recommended Deck Shape

1. Cover
2. Divider: context
3. Three-stat executive snapshot
4. Cards: key findings or recommendations
5. Chart or comparison
6. Proof slide
7. Logo wall if relevant
8. Next steps
9. Close

## Branding Updates

Use `BRANDING.md` for the brand contract and branded-fork merge procedure.
In short: replace `tool/resources/definitions/` for visual brand changes, and do
not edit `tool/resources/templates/` because that folder contains the vendored
Marp/Bespoke presenter shell.

## Branded Fork Updates

When a branded copy has diverged, merge the public upstream implementation instead of asking Claude to recreate the renderer. Follow `BRANDING.md`, preserve the branded `tool/resources/definitions/` files, keep the upstream `tool/resources/templates/` presenter assets, copy in the updated bundled `tool/dist/` runtime, then adjust `SKILL.md` only for branded workflow guidance.
