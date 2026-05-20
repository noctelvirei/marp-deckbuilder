# Marp Deckbuilder Reference

## Build Commands

From the skill folder:

```bash
node scripts/build-deck.mjs examples/example.md --out-dir output
```

Equivalent direct CLI call:

```bash
node tool/src/cli.js build deck.md --html output/deck.html --pptx output/deck.pptx --mode native --resources tool/resources
```

The first run installs Node dependencies into `tool/node_modules` if needed.

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

