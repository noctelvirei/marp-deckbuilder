# Marp Deckbuilder Reference

For chart-only questions, use `references/charts.md` first. This file is the full component reference and should be loaded when the task needs non-chart components, branding/output behavior, or premium slide patterns.

## Build Commands

From the skill folder:

```bash
node scripts/build-deck.mjs examples/example.md --out-dir output --output both
```

`--output` accepts `html`, `pptx`, or `both`. The wrapper defaults to `both`
for backward compatibility, but deck authors should ask the user which output
they want before building.

Equivalent direct CLI call:

```bash
node tool/dist/deckbuilder.mjs build deck.md --html output/deck.html --pptx output/deck.pptx --mode native --resources tool/resources
```

The skill runs the bundled renderer and does not install dependencies.

The generated HTML uses vendored Marp CLI/Bespoke presenter assets from
`tool/resources/templates/`, including the on-screen controls, overview mode,
presenter view, keyboard/touch/wheel navigation, and fullscreen behavior.

The renderer also injects Deckbuilder's HTML navigation chrome. Short decks show
every slide dot at the bottom. Long decks keep one direct-jump button per slide
in the DOM, but present them in a compact horizontally scrollable rail with fade
edges and active-slide centering. This keeps large showcase decks navigable by
click, touch, touchpad, wheel, keyboard, and tablet gestures without letting the
footer dominate the slide design. Do not hand-author replacement navigation in
deck Markdown.

Visible slide numbers are off by default. Add `paginate: true` to deck
frontmatter only when the user explicitly wants pagination on every slide.

When writing an HTML file, the renderer inlines every used `resource:` asset as a
`data:` URL by default. The HTML is self-contained, which works best in Claude
Desktop chats and artifact previews. Authors should still reference assets with
`resource:`; do not paste brand SVGs or backgrounds into deck Markdown by hand.

If `tool/resources/definitions/brand.json` declares `assets.backgrounds`, those
background images are applied to HTML automatically and embedded into the HTML
as `data:` URLs. The same declarations drive PPTX slide backgrounds.
Prefer `assets.backgrounds.dark` and `assets.backgrounds.light` for normal
slide surfaces. Legacy aliases such as `content`, `contentDark`,
`contentLight`, `default`, `cover`, `divider`, and `close` are still supported
by the renderer for branded forks.
Structured component panels become brand-aware translucent surfaces when those
background images are present, so branded art remains visible behind cards.
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
- unsupported attributes on known `deck-*` tags;
- mismatched or unclosed `deck-*` tags;
- child components in the wrong parent;
- empty structured components, such as `deck-card-grid` without `deck-card`;
- invalid charts, including missing labels/values, non-numeric values, or a
  labels/values count mismatch;
- any referenced image/resource that cannot be found under `tool/resources/`;
- any referenced image/resource that tries to resolve outside `tool/resources/`.

The error includes the slide number for component syntax errors. Unsupported
attribute errors list the valid attributes for that component so the agent can
correct the Markdown. Resource errors include the missing reference and the
candidate file paths the renderer checked.

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

For non-card branded assets, use a supported component attribute:

```md
<deck-logo name="Example Bank" image="resource:logos/example-bank.svg"></deck-logo>
<deck-proof logo="resource:logos/example-bank.svg" customer="Example Bank"></deck-proof>
```

Raw HTML `<img>` tags are not supported in deck Markdown. Use `deck-card`
`icon`/`image`/`src`, `deck-logo`, `deck-logo-wall`, `deck-proof`, frontmatter
customer logo metadata, or `deck-slide` logo metadata. If a generic screenshot
or image slide is required and no documented component fits, ask the skill maker
to add a renderer-backed image slide type. Remote HTTP images and arbitrary local
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

- dark is the default deck surface;
- cover, divider, and close slides use dark header treatment and may use image backgrounds;
- normal content/component slides default dark with renderer-owned gradient/glass backgrounds;
- light slides are an explicit opt-in;
- `defaultSurface: dark` or `defaultSurface: light` in frontmatter sets the deck-wide default for non-cover slides;
- `<deck-slide surface="dark" />` and `<deck-slide surface="light" />` override one slide;
- `surface="dark"` or `surface="light"` on an executive component controls that slide.

Do not encode a rule such as "dark headers, white content." The executive style
has both dark and light versions, but light should be chosen intentionally.

The configured brand theme wins over any stale `theme:` value in deck
frontmatter. Authors should usually omit `marp:` and `theme:` entirely.

Customer logo frontmatter:

```yaml
---
title: Partnership update
customerLogo: resource:logos/customer-a.svg
customerName: Customer A
---
```

Nested customer metadata is also accepted:

```yaml
---
customer:
  name: Customer A
  logo: resource:logos/customer-a.svg
---
```

The company logo is always the brand logo and is placed top left. The customer
logo, when present, is placed top right. These slots are applied to both HTML and
PPTX output. For slide-specific logo overrides, use `deck-slide` metadata:

```md
<deck-slide customer-logo="resource:logos/customer-a.svg" customer-name="Customer A" />
```

Do not place customer logos with raw `<img>` tags. Use frontmatter or
`deck-slide` metadata so logo placement stays renderer-owned.

Customer logos should be supplied as transparent PNG assets prepared for the
chosen surface. For dark executive decks, use logo exports with light/white
wordmark text and no white rectangle behind the logo. The renderer preserves
customer brand colours and does not add a white chip/backplate by default. Do not
use CSS inversion filters for customer logos. Branded forks may set
`customerLogoBackplate: true` only for legacy assets that cannot be prepared as
transparent PNGs.

Authors should still reference one logical logo in deck frontmatter and
`deck-logo-wall` items. If the frontmatter says
`customerLogo: resource:logos/customer-a.png`, or a logo wall item uses that same
resource, the renderer automatically prefers sibling surface variants when they
exist:

- dark slides: `customer-a.dark.png`, `customer-a-dark.png`, `customer-a.on-dark.png`, `customer-a-on-dark.png`
- light slides: `customer-a.light.png`, `customer-a-light.png`, `customer-a.on-light.png`, `customer-a-on-light.png`

Surface variants may use a different image extension from the canonical
reference. For example, `resource:logos/customer-a.svg` may resolve to
`resource:logos/customer-a.dark.png` on a dark slide. If no surface variant exists, the
renderer falls back to the referenced asset.

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
| `deck-slide` | zero or one metadata tag at top of a slide | `layout`, `title`, `subtitle`, `eyebrow`, `takeaway`, `footnote`, `surface="dark|light"`, `html-skip`, `pptx-skip`, `html-only`, `pptx-only`, `company-logo`, `company-name`, `customer-logo`, `customer-name`, `animation`, `animation-trigger`, `animation-duration`, `animation-delay`, `animation-sequence` | Slide metadata consumed by renderer; no visible output |
| `deck-divider` | `title` attribute or `h1` child | `act`, `label`, `subtitle` | Full divider slide |
| `deck-stat-grid` | one or more direct `deck-stat` children | each stat can use `value`/`label` attributes or text children | 3-up KPI row |
| `deck-card-grid` | one or more direct `deck-card` children | `columns="3"` or `columns="4"` | 3/4 card layout |
| `deck-card` | title/body/media | `title`, `header`, `icon`, `icon-alt`, `image`, `src`, `image-alt`, `alt` | Card in grid |
| `deck-chart` | matching `labels`/`values` attributes, `points` for area/scatter/bubble, raw numeric `values` for histogram, observation rows for boxplot, ranked values for pareto, balance scores for radar, or flow `links` for sankey | `title`, `series`, `targets`, `target-values`, `links`, `flows`, `edges`, `matrix`, `series-values`, `bins`, `buckets`, `bucket-count`, `type="bar"`, `type="line"`, `type="area"`, `type="waterfall"`, `type="bullet"`, `type="grouped-bar"`, `type="stacked-bar"`, `type="doughnut"`, `type="scatter"`, `type="bubble"`, `type="histogram"`, `type="boxplot"`, `type="pareto"`, `type="radar"`, `type="sankey"`, `x-axis`, `y-axis` | Editable PPTX chart where native support exists; renderer-owned SVG fallback/export path for waterfall/bullet/histogram/boxplot/pareto/radar/sankey |
| `deck-signal-bars` | `metric`, `metric-label`, matching `labels` and `values` attributes | `title`, `subtitle`, `unit`, `accent` | Headline metric plus contribution bars |
| `deck-signal-board` | `title`, `body`, matching `labels` and `values` attributes | `tags`, `chart-title`, `unit`, `accent` | Two-panel narrative signal board with tag pills and bars |
| `deck-orchestration` | `upstream`/`channels`, `layer`/`title`, `capabilities`/`caps`/`tags`, and `downstream`/`systems` attributes | `upstream-label`, `downstream-label`, `tagline`, `caption`, `body`, `logo="company"`, `accent` | Channel-to-orchestration-to-systems architecture slide with branded HTML layer |
| `deck-funnel` | matching `labels` and `values` attributes | `title`, `unit`, `accent` | Conversion/completion funnel |
| `deck-metric-trend` | `metric`, `metric-label`, matching `labels` and `values` attributes | `title`, `unit`, `accent` | Headline KPI plus short trend line |
| `deck-heatmap` | `x-labels`, `y-labels`, and semicolon-separated numeric `values` rows | `title`, `unit`, `caption`, `accent` | Activity/intensity heatmap grid |
| `deck-impact-radar` | matching 3-6 `labels` and `values` attributes | `title`, `bar-title`, `radar-title`, `radar-values`, `unit`, `caption`, `accent` | Combined impact bars plus radar/balance profile |
| `deck-treemap` | matching `labels` and `values` attributes | `title`, `unit`, `caption`, `accent` | Portfolio/composition area treemap |
| `deck-journey-map` | one to six direct `deck-journey-step` children | `title` | Ordered customer/process journey cards |
| `deck-journey-step` | inside `deck-journey-map` | `label`, `title`, `body`, `accent` | Journey stage card |
| `deck-journey-path` | `metric`, `metric-label`, 2-5 `labels` | `notes`, `hotspots`, `callout-title`, `callout-body`, `accent` | Metric-led animated journey path dashboard |
| `deck-comparison` | `rows="left|right;..."` or direct `deck-row` children | `columns`, `left-title`, `right-title`, `left`, `right`, `rows` | Comparison table |
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
- `deck-signal-bars`: up to 5 rows; use it for concentration/contribution stories, not long datasets.
- `deck-signal-board`: up to 5 rows and 5 tags; use it for a short narrative signal plus small contribution bars.
- `deck-orchestration`: up to 8 upstream nodes, 8 downstream nodes, and 6 capability chips.
- `deck-funnel`: up to 6 stages.
- `deck-metric-trend`: up to 8 points.
- `deck-heatmap`: up to 12 x-labels, 8 y-labels, and 80 cells.
- `deck-impact-radar`: 3 to 6 labels; `values` and `radar-values` must be 0-100 scores.
- `deck-treemap`: up to 10 items.
- `deck-journey-map`: 1 to 6 steps.
- `deck-journey-path`: 2 to 5 journey stages; `notes` must match `labels` when provided.
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

## Slide Metadata

Use `deck-slide` for HTML/PPTX split metadata:

```md
<deck-slide pptx-skip="true" />
<deck-slide html-only="true" />

<deck-slide html-skip="true" />
<deck-slide pptx-only="true" />
```

Use skip metadata only to choose between supported structured alternatives. Do
not use skip metadata to hide raw HTML, CSS, JavaScript, canvas charts, or other
custom code in one output.

Use `deck-slide` at the top of a slide for slide metadata:

```md
<deck-slide
  layout="content"
  surface="dark"
  title="Override title"
  subtitle="Override subtitle"
  eyebrow="Section label"
  takeaway="Bottom bar text"
  footnote="Footnote text"
/>
```

Skip metadata also belongs in `deck-slide`:

```md
<deck-slide pptx-skip="true" />
<deck-slide html-skip="true" />
<deck-slide html-only="true" />
<deck-slide pptx-only="true" />
```

Legacy HTML comment directives are still parsed for compatibility, but new deck
Markdown should use `deck-slide` so the renderer can validate the contract.

## Controlled Slide Animations

Use controlled slide animations only through `deck-slide` metadata. Supported
today:

```md
<deck-slide
  animation="enter-fade"
  animation-trigger="after-previous"
  animation-duration="500"
  animation-delay="0"
  animation-sequence="together"
/>
```

Valid triggers are `on-click`, `with-previous`, and `after-previous`. Valid
sequence modes are `together` and `stagger`.

Use `animation-trigger="on-click"` with `animation-sequence="stagger"` for
clicker-driven progressive reveals. Markdown list items reveal one per click in
HTML, and content-slide bullets are split into separate PPTX click effects so
PowerPoint follows the same pacing.

Supported controlled entrance animations:

`enter-appear`, `enter-fade`, `enter-fly`, `enter-wipe`, `enter-zoom`,
`enter-split`, `enter-wheel`, `enter-box`, `enter-diamond`, `enter-circle`,
`enter-blinds`, `enter-checkerboard`, `enter-random-bars`, `enter-dissolve`,
`enter-peek`, and `enter-strips`.

Unsupported animation names, directions, and invalid timing values fail
validation.

Do not add HTML-only presentation animation classes or custom keyframes for
click-ins, fade-ins, entrances, exits, emphasis, or motion paths. Component-local
HTML animations, such as chart draw-ins, impact radar fills, journey path
drawing, and signal board fills, may remain intrinsic to those visual
components. PPTX renders those intrinsic component animations as static final
state visuals unless native PPTX behavior is added later.

## Title Emphasis

Use Markdown bold inside cover, divider, close, takeaway, and executive title
headings when one phrase should carry the branded accent colour. Use `<br>` when
that accent phrase should become its own title row:

```md
# Faster calls.<br>**Total compliance.**<br>No trade-off.
```

In HTML, the renderer applies the brand accent gradient to the bold phrase. PPTX
keeps the title editable and static.

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

<!-- Explicit resource URL, useful when the path contains a folder -->
<deck-card title="Signed pack" src="resource:icons/signed-pack.svg" alt="Signed pack">
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

For line charts, provide the same one-series labels and values shape.

```md
<deck-chart
  type="line"
  title="Weekly completion rate"
  series="Completion"
  labels="W1, W2, W3, W4, W5, W6"
  values="68, 72, 74, 79, 83, 88"
></deck-chart>
```

For area charts, provide the same one-series labels and values shape, or use
comma/semicolon-separated `label:value` point rows.

```md
<deck-chart
  type="area"
  title="Monthly adoption"
  series="Users"
  points="Jan:18, Feb:24, Mar:31, Apr:44"
></deck-chart>
```

For waterfall charts, provide one label per movement and one numeric delta per
label. The renderer computes the running total and draws positive/negative
movement bars. Waterfall charts render as SVG in HTML and as embedded SVG in
PPTX because the current PPTX engine does not expose a native waterfall chart.

```md
<deck-chart
  type="waterfall"
  title="Monthly movement"
  series="Cases"
  labels="Opening, New cases, Exceptions, Recoveries"
  values="52000, 6400, -1200, 3750"
></deck-chart>
```

For bullet charts, provide one actual value and one target value per label.
Bullet charts render as SVG in HTML and as embedded SVG in PPTX because the
current PPTX engine does not expose a native bullet chart.

```md
<deck-chart
  type="bullet"
  title="SLA attainment"
  series="Actual"
  labels="Digital, Assisted, Exceptions"
  values="92, 84, 63"
  targets="95, 90, 75"
></deck-chart>
```

For grouped bars, provide two or more series names and one semicolon-separated
values row per series. Each row must have the same number of values as `labels`.

```md
<deck-chart
  type="grouped-bar"
  title="Quarterly conversion"
  series="Current, Target"
  labels="Q1, Q2, Q3, Q4"
  values="42, 58, 63, 71; 50, 60, 70, 78"
></deck-chart>
```

For stacked bars, use the same multi-series shape. Values must be zero or
positive, and each labelled stack must sum to more than zero.

```md
<deck-chart
  type="stacked-bar"
  title="Quarterly volume mix"
  series="New, Returning, Expansion"
  labels="Q1, Q2, Q3, Q4"
  values="20, 24, 30, 34; 12, 15, 18, 22; 4, 6, 9, 11"
></deck-chart>
```

For doughnut charts, provide one non-negative value per label. Values must sum
to more than zero.

```md
<deck-chart
  type="doughnut"
  title="Portfolio mix"
  series="Cases"
  labels="Digital, Branch, Contact centre"
  values="52, 31, 17"
></deck-chart>
```

For scatter charts, provide semicolon-separated point rows. Each point row uses
pipe-separated `x|y|Label` fields. The label is optional, but x and y must be
numeric.

```md
<deck-chart
  type="scatter"
  title="Impact versus effort"
  series="Initiatives"
  x-axis="Effort"
  y-axis="Impact"
  points="2|8|Automate; 5|6|Consolidate; 8|3|Defer"
></deck-chart>
```

For bubble charts, provide comma-separated or semicolon-separated point rows.
Each point row uses `x:y:r` fields, where r is the bubble radius/magnitude.
Pipe-separated `x|y|r` rows are also accepted. x, y, and r must be numeric, and
r must be greater than zero.

```md
<deck-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-axis="Touches"
  y-axis="Completion"
  points="2:93:10, 4:88:14, 7:72:18, 9:61:9"
></deck-chart>
```

For histogram charts, provide raw numeric observations in `values`. The renderer
computes the bins; do not pre-bin the values into labels. Use optional `bins`,
`buckets`, or `bucket-count` between 2 and 30.

```md
<deck-chart
  type="histogram"
  title="Response time distribution"
  series="Cases"
  values="1.2, 1.8, 2.1, 2.4, 2.8, 3.3, 3.7, 4.1"
  bins="6"
></deck-chart>
```

For boxplot charts, provide one label per group and semicolon-separated
observation rows in `values`, `matrix`, or `series-values`. Each row uses
pipe-separated numeric observations and needs at least five values.

```md
<deck-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-axis="Days"
  labels="Digital, Assisted, Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></deck-chart>
```

For Pareto charts, provide one label per driver and one zero-or-positive numeric
value per label. The renderer sorts drivers by value and draws the cumulative
percentage line.

```md
<deck-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  labels="Identity, Address, Income, Consent"
  values="42, 18, 27, 13"
></deck-chart>
```

For radar charts, provide 3 to 8 short labels and one zero-or-positive numeric
value per label. At least one value must be above zero. HTML renders this as a
live Chart.js radar with persistent point labels and an SVG fallback; PPTX embeds
the renderer-owned SVG fallback.

```md
<deck-chart
  type="radar"
  title="Capability profile"
  series="Score"
  labels="Speed, Compliance, Reach, Resilience, Effort, Insight"
  values="91, 88, 84, 72, 58, 79"
></deck-chart>
```

For Sankey charts, provide comma-separated flow links. Each link uses
`source>target:value`, `source->target:value`, or `source=>target:value`.
Values must be numeric and greater than zero. Links cannot connect a node to
itself, and the flow graph must not contain cycles.

```md
<deck-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  links="Opened>Started:4400, Started>Completed:3800, Started>Exception:380, Exception>Recovered:220"
></deck-chart>
```

Supported chart types: `bar`, `line`, `area`, `waterfall`, `bullet`,
`grouped-bar`, `stacked-bar`, `doughnut`, `scatter`, `bubble`, `histogram`,
`boxplot`, `pareto`, `radar`, `sankey`. If a chart type is not
listed here, ask the skill maker to add it as a renderer-backed `deck-*`
capability.

### Signal Bars

Use `deck-signal-bars` when the slide needs one headline metric plus a small
set of contribution or concentration bars. This replaces hand-authored HTML/SVG
for common "97% of volume comes from these segments" slides.

```md
<deck-signal-bars
  metric="97%"
  metric-label="of volume is concentrated in the two largest segments."
  title="Volume split"
  subtitle="Renderer-owned panels and bars work in HTML and PPTX."
  labels="Segment A, Segment B, Long tail"
  values="65, 32, 3"
  unit="%"
></deck-signal-bars>
```

### Signal Board

Use `deck-signal-board` when the slide needs a short narrative panel, tag pills,
and a compact signal bar chart. HTML may receive renderer-owned visual polish;
PPTX output is static editable shapes.

```md
<deck-signal-board
  title="Executive signal"
  body="The renderer output can carry dashboard, callout, and narrative reporting patterns."
  tags="Revenue protection, Journey speed, Audit confidence"
  chart-title="Signal strength"
  labels="Speed, Control, Effort"
  values="82, 74, 63"
></deck-signal-board>
```

### Orchestration Layer

Use `deck-orchestration` when the story is how customer channels, a branded
orchestration layer, capabilities, and core systems connect. Set
`logo="company"` when the layer title should be replaced by the configured
company logo in the HTML deck.

```md
# We sit between your channels and your core systems

<deck-orchestration
  upstream-label="Customer channels"
  upstream="Voice, Chat, Web, App, In-store"
  layer="ExampleCo"
  logo="company"
  tagline="the AI orchestration layer"
  capabilities="Identity & MFA, eSignatures, Document capture & IDP, Structured compliance steps"
  downstream-label="Core systems"
  downstream="CRM, Billing, Credit, CCaaS, Document store"
  caption="One connected journey with compliance built into the flow."
></deck-orchestration>
```

### Funnel

Use `deck-funnel` for conversion, completion, stage-dropoff, or simple process
funnel stories. It renders a renderer-owned tapered funnel from the same compact
data in HTML and PPTX.

```md
<deck-funnel
  title="Completion funnel"
  labels="Invited, Started, Completed"
  values="8420, 6568, 5136"
></deck-funnel>
```

### Metric Trend

Use `deck-metric-trend` for a headline KPI paired with a short weekly/monthly
trend. The renderer owns the SVG line chart in HTML and a native editable line
chart in PPTX.

```md
<deck-metric-trend
  metric="92%"
  metric-label="completed within SLA"
  title="Weekly trend"
  labels="W1, W2, W3, W4, W5"
  values="70, 78, 76, 86, 92"
  unit="%"
></deck-metric-trend>
```

### Heatmap

Use `deck-heatmap` for activity/intensity grids across two categorical axes.
Values are semicolon-separated rows; each row contains comma-separated numeric
cells matching `x-labels`.

```md
<deck-heatmap
  title="Activity by hour"
  x-labels="08, 09, 10, 11"
  y-labels="Mon, Tue, Wed"
  values="42, 58, 76, 64; 35, 61, 88, 72; 50, 66, 94, 81"
  unit=" cases"
  caption="Darker cells represent higher activity."
></deck-heatmap>
```

### Impact Radar

Use `deck-impact-radar` for combined workstream impact bars and radar/balance
profiles. Values are 0-100 scores. If `radar-values` is omitted, the radar
uses the same values as the bars.

```md
<deck-impact-radar
  title="Scenario operating model"
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
  radar-values="84, 76, 68, 91"
  caption="Renderer-owned SVG in HTML and static SVG in PPTX."
></deck-impact-radar>
```

### Treemap

Use `deck-treemap` for portfolio or composition area charts. The renderer owns
the treemap layout in both HTML and PPTX.

```md
<deck-treemap
  title="Portfolio mix"
  labels="Journey A, Journey B, Journey C, Journey D"
  values="5200, 1100, 860, 380"
  unit=" cases"
  caption="Tile area is proportional to case volume."
></deck-treemap>
```

### Journey Map

Use `deck-journey-map` for ordered customer journeys, process stages, or
handoff maps. Each stage is a direct `deck-journey-step` child.

```md
<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start the secure journey."></deck-journey-step>
  <deck-journey-step label="02" title="Capture" body="Collect evidence and consent."></deck-journey-step>
  <deck-journey-step label="03" title="Review" body="Check completeness."></deck-journey-step>
</deck-journey-map>
```

### Journey Path

Use `deck-journey-path` for a metric-led journey dashboard with stage labels,
hotspots, and one intervention callout. HTML can animate the generated path;
PPTX embeds a static generated SVG and keeps the metric panel editable.

```md
<deck-journey-path
  metric="42%"
  metric-label="of avoidable delay sits in two handoffs."
  labels="Invite, Evidence, Approval, Complete"
  notes="fast start, largest rework loop, decision queue, customer notified"
  hotspots="Evidence, Approval"
  callout-title="Recommended intervention"
  callout-body="Automated reminders plus controlled evidence checks"
></deck-journey-path>
```

### Retired Visual SVG

`deck-visual` is retired. It used to allow inline SVG, which gave agents a raw
authoring escape hatch. Do not use it. For rich charts, diagrams, maps,
dashboard panels, or annotated visuals, choose an existing renderer-backed
component such as `deck-impact-radar`, `deck-journey-path`, `deck-heatmap`,
`deck-treemap`, or `deck-chart`. If none fits, ask the skill maker to add the
missing `deck-*` component.

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
  source="Source: synthetic operating metrics"
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
<deck-slide surface="dark" />

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
| `deck-chart` | `deck-chart`, `deck-chart-bar`, `deck-chart-line`, `deck-chart-line-svg`, `deck-chart-line-path`, `deck-chart-line-point`, `deck-chart-line-point-value`, `deck-chart-line-grid`, `deck-chart-line-axis`, `deck-chart-line-tick`, `deck-chart-area`, `deck-chart-area-svg`, `deck-chart-area-fill`, `deck-chart-area-path`, `deck-chart-area-point`, `deck-chart-area-point-value`, `deck-chart-area-grid`, `deck-chart-area-axis`, `deck-chart-area-tick`, `deck-chart-waterfall`, `deck-chart-waterfall-svg`, `deck-waterfall-step`, `deck-waterfall-bar`, `deck-waterfall-bar-positive`, `deck-waterfall-bar-negative`, `deck-waterfall-connector`, `deck-waterfall-label`, `deck-waterfall-value`, `deck-waterfall-tick`, `deck-waterfall-grid`, `deck-waterfall-axis`, `deck-chart-bullet`, `deck-chart-bullet-svg`, `deck-bullet-row`, `deck-bullet-track`, `deck-bullet-bar`, `deck-bullet-target`, `deck-bullet-label`, `deck-bullet-value`, `deck-bullet-tick`, `deck-bullet-grid`, `deck-bullet-axis`, `deck-chart-histogram`, `deck-chart-histogram-svg`, `deck-histogram-bin`, `deck-histogram-bar`, `deck-histogram-label`, `deck-histogram-count`, `deck-histogram-grid`, `deck-histogram-axis`, `deck-histogram-tick`, `deck-histogram-axis-label`, `deck-chart-boxplot`, `deck-chart-boxplot-svg`, `deck-boxplot-item`, `deck-boxplot-whisker`, `deck-boxplot-box`, `deck-boxplot-median`, `deck-boxplot-label`, `deck-boxplot-grid`, `deck-boxplot-axis`, `deck-boxplot-tick`, `deck-boxplot-axis-label`, `deck-chart-pareto`, `deck-chart-pareto-svg`, `deck-pareto-item`, `deck-pareto-bar`, `deck-pareto-line`, `deck-pareto-point`, `deck-pareto-label`, `deck-pareto-value`, `deck-pareto-grid`, `deck-pareto-axis`, `deck-pareto-tick`, `deck-pareto-percent-tick`, `deck-pareto-axis-label`, `deck-chart-radar`, `deck-chart-radar-svg`, `deck-radar-grid`, `deck-radar-shape`, `deck-radar-point`, `deck-radar-label`, `deck-radar-scale`, `deck-chart-sankey`, `deck-chart-sankey-svg`, `deck-sankey-links`, `deck-sankey-link`, `deck-sankey-nodes`, `deck-sankey-node`, `deck-sankey-node-rect`, `deck-sankey-label`, `deck-sankey-value`, `deck-sankey-caption`, `deck-chart-grouped-bar`, `deck-chart-stacked-bar`, `deck-chart-doughnut`, `deck-chart-scatter`, `deck-chart-bubble`, `deck-chart-row`, `deck-chart-grouped-row`, `deck-chart-grouped-bar-row`, `deck-chart-stacked-row`, `deck-chart-stacked-track`, `deck-chart-stacked-segment`, `deck-chart-doughnut-ring`, `deck-chart-doughnut-row`, `deck-chart-scatter-svg`, `deck-chart-scatter-point`, `deck-chart-bubble-svg`, `deck-chart-bubble-point`, `deck-chart-legend`, `deck-chart-label`, `deck-chart-track`, `deck-chart-fill` |
| `deck-signal-bars` | `deck-signal-bars`, `deck-signal-summary`, `deck-signal-chart`, `deck-signal-row`, `deck-signal-track`, `deck-signal-fill` |
| `deck-signal-board` | `deck-signal-board`, `deck-signal-board-panel`, `deck-signal-board-tags`, `deck-signal-board-tag`, `deck-signal-board-chart`, `deck-signal-row`, `deck-signal-track`, `deck-signal-fill` |
| `deck-orchestration` | `deck-orchestration`, `deck-orchestration-tier`, `deck-orchestration-tier-label`, `deck-orchestration-nodes`, `deck-orchestration-node`, `deck-orchestration-layer`, `deck-orchestration-layer-brand`, `deck-orchestration-layer-tag`, `deck-orchestration-caps`, `deck-orchestration-cap`, `deck-orchestration-caption` |
| `deck-funnel` | `deck-funnel`, `deck-funnel-svg`, `deck-funnel-stage`, `deck-funnel-segment`, `deck-funnel-stage-label`, `deck-funnel-stage-value`, `deck-funnel-stage-rate` |
| `deck-metric-trend` | `deck-metric-trend`, `deck-metric-trend-summary`, `deck-metric-trend-chart`, `deck-metric-trend-line`, `deck-metric-trend-dot` |
| `deck-heatmap` | `deck-heatmap`, `deck-heatmap-grid`, `deck-heatmap-cell`, `deck-heatmap-x-label`, `deck-heatmap-y-label`, `deck-heatmap-accent-<accent>` |
| `deck-impact-radar` | `deck-impact-radar`, `deck-impact-radar-svg`, `deck-impact-radar-caption`, `deck-impact-radar-accent-<accent>` |
| `deck-treemap` | `deck-treemap`, `deck-treemap-svg`, `deck-treemap-cell`, `deck-treemap-fill-<index>`, `deck-treemap-label`, `deck-treemap-value` |
| `deck-journey-map` | `deck-journey-map`, `deck-journey-steps`, `deck-journey-step`, `deck-journey-step-accent-<accent>` |
| `deck-journey-path` | `deck-journey-path`, `deck-journey-path-summary`, `deck-journey-path-map`, `deck-journey-path-svg`, `deck-journey-path-accent-<accent>` |
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

## Structured Premium Slides

HTML is the high-fidelity presentation format, but authors still use the same
strict Markdown contract: prose, Markdown lists/tables, and supported `deck-*`
components only. The renderer owns HTML, CSS, JavaScript, presenter chrome,
chart runtime, branding, and PPTX geometry.

Use `deck-signal-bars` for headline metric plus contribution-bar slides. Use
`deck-signal-board` for narrative dashboards with tag pills and bars. Use
`deck-orchestration` for channel-to-platform-to-system architecture slides. Use
`deck-impact-radar`, `deck-journey-path`, `deck-heatmap`, `deck-treemap`, or
`deck-chart` for richer visuals. Use `deck-stat-grid`, `deck-card-grid`, or the
other structured components when PowerPoint editability matters more than exact
visual fidelity.

For analytics, research, customer, and executive decks, do not default to a
lowest-common-denominator slide. Make the HTML version premium by choosing the
right renderer-backed component. If the required slide type does not exist,
tell the user to ask the skill maker to add it.

Use structured components when they exist. For concentration, contribution, or
small portfolio-mix stories, use `deck-signal-bars` instead of raw HTML/SVG:

```md
# Portfolio concentration

<deck-signal-bars
  metric="97%"
  metric-label="from the top two clients"
  title="Client volume split"
  labels="Pilot, Customer A Region, Other active"
  values="65, 32, 3"
  unit="%"
></deck-signal-bars>
```

For short narrative dashboards with pill tags and signal bars, use
`deck-signal-board` instead of raw layout HTML:

```md
# Executive signal

<deck-signal-board
  title="Executive signal"
  body="The renderer output can carry dashboard, callout, and narrative reporting patterns."
  tags="Revenue protection, Journey speed, Audit confidence"
  chart-title="Signal strength"
  labels="Speed, Control, Effort"
  values="82, 74, 63"
></deck-signal-board>
```

For conversion or completion funnels, use `deck-funnel` instead of raw HTML/SVG:

```md
# Conversion funnel

<deck-funnel
  title="Completion funnel"
  labels="Invited, Started, Completed"
  values="8420, 6568, 5136"
></deck-funnel>
```

For a headline KPI plus short trend line, use `deck-metric-trend` instead of raw
HTML/SVG metric dashboards:

```md
# Operating signal

<deck-metric-trend
  metric="92%"
  metric-label="completed within SLA"
  title="Weekly trend"
  labels="W1, W2, W3, W4, W5"
  values="70, 78, 76, 86, 92"
  unit="%"
></deck-metric-trend>
```

For activity/intensity heatmaps, use `deck-heatmap` instead of raw Observable
Plot JavaScript. Use comma-separated labels; use semicolons between value rows
and commas between cells within each row:

```md
# Activity heatmap

<deck-heatmap
  title="Activity by hour"
  x-labels="08, 09, 10, 11"
  y-labels="Mon, Tue, Wed"
  values="42, 58, 76, 64; 35, 61, 88, 72; 50, 66, 94, 81"
  unit=" cases"
  caption="Darker cells represent higher activity."
></deck-heatmap>
```

For combined impact bars and radar/balance profiles, use `deck-impact-radar`
instead of raw SVG dashboards:

```md
# Operating balance

<deck-impact-radar
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
></deck-impact-radar>
```

For portfolio/composition treemaps, use `deck-treemap` instead of raw D3:

```md
# Portfolio treemap

<deck-treemap
  title="Portfolio mix"
  labels="Journey A, Journey B, Journey C, Journey D"
  values="5200, 1100, 860, 380"
  unit=" cases"
></deck-treemap>
```

For ordered customer journeys, process stages, or handoff maps, use
`deck-journey-map` instead of raw HTML/CSS card grids:

```md
# Customer journey

<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start the secure journey."></deck-journey-step>
  <deck-journey-step label="02" title="Capture" body="Collect evidence and consent."></deck-journey-step>
  <deck-journey-step label="03" title="Review" body="Check completeness."></deck-journey-step>
</deck-journey-map>
```

For metric-led path diagrams with hotspots and a single recommendation callout,
use `deck-journey-path` instead of raw HTML/SVG dashboards:

```md
# Journey delay

<deck-journey-path
  metric="42%"
  metric-label="of avoidable delay sits in two handoffs."
  labels="Invite, Evidence, Approval, Complete"
  notes="fast start, largest rework loop, decision queue, customer notified"
  hotspots="Evidence, Approval"
  callout-title="Recommended intervention"
  callout-body="Automated reminders plus controlled evidence checks"
></deck-journey-path>
```

### Split HTML/PPTX Slides

Use paired slides only when HTML and PPTX need different supported structured
representations:

- `<deck-slide pptx-skip="true" />` keeps a supported HTML-focused slide out of the PPTX.
- `<deck-slide html-skip="true" />` or `<deck-slide pptx-only="true" />` keeps the editable fallback out of the HTML deck.

Do not use paired raw HTML slides for concentration, contribution-bar, funnel,
signal-board, metric-trend, heatmap, impact-radar, treemap, journey-map, or journey-path
stories; `deck-signal-bars`, `deck-signal-board`, `deck-funnel`,
`deck-metric-trend`, `deck-heatmap`, `deck-impact-radar`, `deck-treemap`,
`deck-journey-map`, and `deck-journey-path` are the supported components for
those capabilities.

```md
<deck-slide pptx-skip="true" />

# Journey volume

<deck-chart
  type="bar"
  title="Cases by journey"
  labels="Journey A, Journey B, Journey C, Journey D"
  values="5200, 1100, 860, 380"
></deck-chart>
```

### Unsupported Custom HTML/JavaScript

The renderer rejects raw `<script>`, `<style>`, `<canvas>`, `<iframe>`,
`<object>`, `<embed>`, `<div>`, `<section>`, `<article>`, `<figure>`,
`<table>`, `<form>`, `<button>`, media tags, raw `<svg>`, and `deck-visual`.
If the requested interaction, chart, animation, visual, or layout is not
available as documented syntax, ask the skill maker to add it as a
renderer-backed `deck-*` component.

### SVG Metric Dashboard

Use `deck-metric-trend`; raw SVG metric dashboards are no longer needed for
this capability.

### Annotated Funnel

Use `deck-funnel`; raw HTML/CSS funnel bars are no longer needed for this
capability.

### Journey Map

Use `deck-journey-map`; raw HTML/CSS journey card grids are no longer needed
for this capability.

### Observable Plot Heatmap

Use `deck-heatmap`; raw Observable Plot heatmap JavaScript is no longer needed
for this capability.

### Impact/Radar Dashboard

Use `deck-impact-radar`; raw SVG impact bars, radar charts, and operating
balance diagrams are no longer needed for this capability.

### D3 Treemap

Use `deck-treemap`; raw D3 treemap JavaScript is no longer needed for this
capability.

### Premium Slide Safety

- Do not use CDN `<script src>` tags.
- Do not paste minified JS libraries, raw chart containers, or initializer scripts into Markdown.
- Do not write raw CSS or raw HTML layout containers.
- Do not use raw SVG or `deck-visual`; request a renderer-backed component.
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
