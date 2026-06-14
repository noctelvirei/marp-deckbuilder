---
title: Proof Demo - Renderer Components
presenter:
  name: Sam Taylor
  role: Solutions
---

<deck-slide layout="cover" />

# Renderer Component Proof

This deck proves that compact Markdown can carry expressive slide intent while the renderer owns layout, branding, and PPTX output.

---

<deck-slide
  eyebrow="STRUCTURED SURFACE"
  takeaway="Use renderer-backed components for rich visuals instead of raw HTML or CSS."
/>

# Executive signal stays compact

<deck-signal-board
  title="Executive signal"
  body="The renderer output can carry dashboard, callout, and narrative reporting patterns while keeping Markdown small and maintainable."
  tags="Revenue protection, Journey speed, Audit confidence"
  chart-title="Signal strength"
  labels="Speed, Control, Effort"
  values="82, 74, 63"
></deck-signal-board>

---

<deck-slide
  layout="cards"
  eyebrow="EDITABLE PPTX SECTION"
  takeaway="Use deck components when the PowerPoint slide must remain fully editable."
/>

# Convert important visuals into components

<deck-card-grid columns="3">
  <deck-card title="Components for expression">
    <p>Use supported slide tags for dashboards, callouts, and narrative summaries.</p>
  </deck-card>
  <deck-card title="Components for PPTX">
    <p>Use deck tags when PowerPoint users must edit the result.</p>
  </deck-card>
  <deck-card title="Definitions for brand">
    <p>Keep color, font, layout, and spacing rules in replaceable files.</p>
  </deck-card>
</deck-card-grid>

---

<deck-slide
  layout="chart"
  eyebrow="STRUCTURED DATA"
  takeaway="Charts are the right route for editable PowerPoint reporting visuals."
/>

# Component charts stay editable

<deck-chart
  type="bar"
  title="Impact by workstream"
  series="Score"
  labels="Sales, Service, Operations, Risk"
  values="76, 84, 71, 68"
></deck-chart>

---

<deck-slide
  eyebrow="DECISION RULE"
  takeaway="The authoring rule is simple: use documented components, or ask for a new component."
/>

# Choose the right authoring surface

<deck-comparison left-title="Unsupported raw HTML" right-title="Deck components">
  <deck-row label="Best for" left="No longer allowed in deck Markdown" right="Editable business slides"></deck-row>
  <deck-row label="Rendered by" left="Rejected with a clear error" right="Bundled HTML and PPTX renderers"></deck-row>
  <deck-row label="PowerPoint output" left="Unavailable" right="Native shapes and charts"></deck-row>
  <deck-row label="Token cost" left="High and brittle" right="Lowest for repeatable layouts"></deck-row>
</deck-comparison>

---

<deck-close title="Built from one Markdown file" name="Sam Taylor" role="Solutions"></deck-close>
