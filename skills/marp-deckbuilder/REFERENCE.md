# Marp Deckbuilder Reference

## Build Commands

From the skill folder:

```bash
node scripts/build-deck.mjs examples/example.md --out-dir output
```

Equivalent direct CLI call:

```bash
node tool/dist/deckbuilder.cjs build deck.md --html output/deck.html --pptx output/deck.pptx --mode native --resources tool/resources
```

The skill runs the bundled renderer and does not install dependencies.

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

These patterns are best for HTML output. If PowerPoint editability matters, pair the rich HTML slide with a simpler `deck-*` summary slide.

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

Replace files in `tool/resources/definitions/` to update the brand:

- `brand.json`: slide geometry, colors, fonts, PPTX component layout
- `theme.css`: HTML/Marp styling

Do not edit `SKILL.md` for brand changes.
