---
title: Proof Demo - Rich HTML
presenter:
  name: Sam Taylor
  role: Solutions
---

<!-- layout: cover -->

# Rich HTML Proof

This deck proves that Markdown can carry expressive HTML while native components preserve editable PPTX output.

---

<style scoped>
.signal-board {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 28px;
  align-items: stretch;
}
.signal-panel {
  border: 1px solid #dedede;
  background: #fdfdfd;
  padding: 28px;
}
.signal-panel h2 {
  margin: 0 0 16px;
  font-size: 28px;
}
.signal-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}
.signal-pill {
  border: 1px solid #0f82f5;
  color: #0a5fab;
  padding: 7px 10px;
  font-size: 14px;
}
.signal-stack {
  display: grid;
  gap: 12px;
}
.signal-row {
  display: grid;
  grid-template-columns: 92px 1fr 54px;
  gap: 12px;
  align-items: center;
  font-size: 15px;
}
.signal-track {
  height: 12px;
  background: #edf2f7;
}
.signal-fill {
  display: block;
  height: 100%;
  background: #0f82f5;
}
</style>

<!-- eyebrow: HTML SURFACE -->
<!-- takeaway: Rich HTML is rendered by Marp Core for the HTML deck; PPTX editability comes from structured components. -->

# A custom HTML slide can still live in the deck

<div class="signal-board">
  <section class="signal-panel">
    <h2>Executive signal</h2>
    <p>The HTML output can carry bespoke layout for dashboards, callouts, and narrative report pages.</p>
    <div class="signal-pill-row">
      <span class="signal-pill">Revenue protection</span>
      <span class="signal-pill">Journey speed</span>
      <span class="signal-pill">Audit confidence</span>
    </div>
  </section>
  <section class="signal-panel signal-stack">
    <div class="signal-row"><span>Speed</span><span class="signal-track"><span class="signal-fill" style="width:82%"></span></span><strong>82</strong></div>
    <div class="signal-row"><span>Control</span><span class="signal-track"><span class="signal-fill" style="width:74%"></span></span><strong>74</strong></div>
    <div class="signal-row"><span>Effort</span><span class="signal-track"><span class="signal-fill" style="width:63%"></span></span><strong>63</strong></div>
  </section>
</div>

---

<!-- layout: cards -->
<!-- eyebrow: EDITABLE PPTX SECTION -->
<!-- takeaway: Use deck components when the PowerPoint slide must remain fully editable. -->

# Convert important visuals into components

<deck-card-grid columns="3">
  <deck-card title="HTML for expression">
    <p>Use raw HTML where the browser view is the primary artifact.</p>
  </deck-card>
  <deck-card title="Components for PPTX">
    <p>Use deck tags when PowerPoint users must edit the result.</p>
  </deck-card>
  <deck-card title="Definitions for brand">
    <p>Keep color, font, layout, and spacing rules in replaceable files.</p>
  </deck-card>
</deck-card-grid>

---

<!-- layout: chart -->
<!-- eyebrow: STRUCTURED DATA -->
<!-- takeaway: Charts are the right route for editable PowerPoint reporting visuals. -->

# Component charts stay editable

<deck-chart
  type="bar"
  title="Impact by workstream"
  series="Score"
  labels="Sales, Service, Operations, Risk"
  values="76, 84, 71, 68"
></deck-chart>

---

<!-- eyebrow: DECISION RULE -->
<!-- takeaway: The authoring rule is simple: HTML for rich web slides, components for editable PPTX. -->

# Choose the right authoring surface

<deck-comparison left-title="Raw HTML" right-title="Deck components">
  <deck-row label="Best for" left="Bespoke visual slides" right="Editable business slides"></deck-row>
  <deck-row label="Rendered by" left="Bundled Marp Core" right="Bundled PPTX renderer"></deck-row>
  <deck-row label="PowerPoint output" left="Text fallback only" right="Native shapes and charts"></deck-row>
  <deck-row label="Token cost" left="Low for custom view" right="Lowest for repeatable layouts"></deck-row>
</deck-comparison>

---

<deck-close title="Built from one Markdown file" name="Sam Taylor" role="Solutions"></deck-close>
