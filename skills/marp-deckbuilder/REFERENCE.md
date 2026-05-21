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
If it declares `assets.logo`, the renderer positions that logo from
`layouts.logo` and embeds it into HTML as a `data:` URL too.

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

## Component Syntax

### Divider

```md
<deck-divider act="ACT 01" title="The Moment." subtitle="A short transition line."></deck-divider>
```

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
  <deck-card title="Intake"><p>Standardize required data capture.</p></deck-card>
  <deck-card title="Evidence"><p>Replace attachment loops.</p></deck-card>
  <deck-card title="Approval"><p>Route decisions through a visible flow.</p></deck-card>
</deck-card-grid>
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

Use `deck-visual` for rich charts, diagrams, maps, and report panels that should stay visually identical between HTML and PPTX without asking the agent to build hundreds of PowerPoint shapes. The HTML output keeps the SVG inline. The PPTX output embeds the SVG as a crisp visual image, so it is not shape-editable in PowerPoint; edit the source Markdown/SVG and rebuild. Put essential fills, strokes, fonts, labels, and dimensions inside the SVG because PPTX receives only the SVG content.

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

Images resolve against `tool/resources/`. If an image is absent, the PPTX uses an editable text tile.

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

For analytics, reporting, research, and sales/customer decks, do not default to a lowest-common-denominator deck. Make the HTML version the premium presentation: at least one main insight should use a richer HTML/SVG/JS treatment than the editable PPTX fallback.

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

# Live browser demo

<style scoped>
.console-demo { height:420px; padding:24px; background:#07101e; color:#e2e8f0; }
</style>

<div class="console-demo" id="demo">Preparing report...</div>

<script>
  const demo = document.getElementById('demo')
  if (demo) {
    setTimeout(() => {
      demo.textContent = 'Report ready - opening in browser'
    }, 800)
  }
</script>
```

If the PowerPoint audience still needs context, add a normal editable summary slide immediately after the browser-only slide.

### SVG Metric Dashboard

```md
<style scoped>
.metric-board { display:grid; grid-template-columns:1fr 1fr; gap:28px; }
.metric-card { padding:26px; border:1px solid #dedede; background:#fdfdfd; }
.metric-card strong { display:block; color:#0f82f5; font-size:52px; line-height:1; }
.metric-card span { color:#444444; font-size:16px; }
</style>

# Operating signal

<div class="metric-board">
  <div class="metric-card"><strong>92%</strong><span>completed within SLA</span></div>
  <svg viewBox="0 0 520 220" role="img" aria-label="Weekly trend">
    <polyline fill="none" stroke="#0f82f5" stroke-width="8" points="24,170 130,142 236,151 342,96 496,54"/>
    <g fill="#090909">
      <text x="24" y="204">W1</text><text x="130" y="204">W2</text><text x="236" y="204">W3</text><text x="342" y="204">W4</text><text x="472" y="204">W5</text>
    </g>
  </svg>
</div>
```

### Annotated Funnel

```md
<style scoped>
.funnel { display:grid; gap:12px; margin-top:24px; }
.stage { display:grid; grid-template-columns:180px 1fr 90px; align-items:center; gap:16px; }
.bar { height:34px; background:#eef6fe; }
.bar span { display:block; height:100%; background:#0f82f5; }
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
<style scoped>
.journey { display:grid; grid-template-columns:repeat(5, 1fr); gap:14px; margin-top:34px; }
.journey article { min-height:160px; padding:18px; border-top:5px solid #0f82f5; background:#fdfdfd; }
.journey small { color:#0f82f5; font-weight:500; }
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
