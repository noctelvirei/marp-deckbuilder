---
title: Proof Demo - HTML Showcase
presenter:
  name: Jordan Lee
  role: Customer Strategy
---

<!-- layout: cover -->

# HTML Showcase Proof

The HTML deck is the polished data story. The PPTX is the editable handoff.

---

<style scoped>
.hero-dashboard {
  display: grid;
  grid-template-columns: .95fr 1.25fr;
  gap: 34px;
  align-items: stretch;
  margin-top: 12px;
}
.hero-copy {
  display: grid;
  align-content: center;
  padding: 30px;
  border: 1px solid #dedede;
  background: #fdfdfd;
}
.hero-copy strong {
  display: block;
  color: #0f82f5;
  font-size: 76px;
  font-weight: 500;
  line-height: 1;
}
.hero-copy span {
  display: block;
  margin-top: 12px;
  color: #444444;
  font-size: 19px;
}
.journey-map {
  overflow: visible;
}
.journey-path {
  fill: none;
  stroke: #0f82f5;
  stroke-width: 10;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 980;
  animation: dash-in 1.6s ease-out both;
}
.journey-node {
  fill: #ffffff;
  stroke: #0f82f5;
  stroke-width: 5;
}
.journey-hotspot {
  fill: #fc5161;
}
.journey-label {
  fill: #090909;
  font: 500 17px "Poppins", "Aptos", sans-serif;
}
.journey-note {
  fill: #444444;
  font: 13px "Poppins", "Aptos", sans-serif;
}
@keyframes dash-in {
  from { stroke-dashoffset: 980; }
  to { stroke-dashoffset: 0; }
}
</style>

<!-- eyebrow: PREMIUM HTML VIEW -->
<!-- takeaway: The HTML deck can use SVG, animation, and custom report layouts while PPTX remains a practical editable handoff. -->

# The story is clearer as an HTML data view

<div class="hero-dashboard">
  <div class="hero-copy">
    <strong>42%</strong>
    <span>of avoidable delay sits in two handoffs. The presentation can show the journey, not just describe it.</span>
  </div>
  <svg class="journey-map" viewBox="0 0 680 390" role="img" aria-label="Annotated journey path">
    <path class="journey-path" d="M50 300 C 145 185, 205 230, 260 150 S 400 68, 470 150 S 575 275, 630 95"/>
    <g>
      <circle class="journey-node" cx="50" cy="300" r="22"/>
      <text class="journey-label" x="24" y="350">Invite</text>
      <text class="journey-note" x="24" y="370">fast start</text>
    </g>
    <g>
      <circle class="journey-node" cx="260" cy="150" r="22"/>
      <circle class="journey-hotspot" cx="292" cy="119" r="10"/>
      <text class="journey-label" x="215" y="105">Evidence</text>
      <text class="journey-note" x="194" y="125">largest rework loop</text>
    </g>
    <g>
      <circle class="journey-node" cx="470" cy="150" r="22"/>
      <circle class="journey-hotspot" cx="502" cy="119" r="10"/>
      <text class="journey-label" x="426" y="105">Approval</text>
      <text class="journey-note" x="405" y="125">decision queue</text>
    </g>
    <g>
      <circle class="journey-node" cx="630" cy="95" r="22"/>
      <text class="journey-label" x="586" y="52">Complete</text>
      <text class="journey-note" x="566" y="72">customer notified</text>
    </g>
    <rect x="356" y="252" width="238" height="76" fill="#eef6fe" stroke="#0f82f5"/>
    <text class="journey-label" x="376" y="284">Recommended intervention</text>
    <text class="journey-note" x="376" y="306">automated reminders plus controlled evidence checks</text>
  </svg>
</div>

---

<style scoped>
.impact-lab {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-top: 8px;
}
.impact-panel {
  padding: 26px;
  border: 1px solid #dedede;
  background: #fdfdfd;
}
.impact-panel h2 {
  margin-bottom: 20px;
  font-size: 24px;
}
.spark-row {
  display: grid;
  grid-template-columns: 120px 1fr 54px;
  gap: 14px;
  align-items: center;
  margin: 18px 0;
}
.spark-track {
  height: 16px;
  background: #f1f1f1;
}
.spark-track span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #0f82f5, #59d6fd);
}
.radar {
  width: 100%;
  height: auto;
}
.radar polygon {
  filter: drop-shadow(0 16px 18px rgba(15, 130, 245, .18));
}
</style>

<!-- eyebrow: REPORT MODE -->
<!-- takeaway: Claude can update these values by editing Markdown; nobody has to drag shapes around by hand. -->

# The HTML version can behave like a mini report

<div class="impact-lab">
  <section class="impact-panel">
    <h2>Workstream impact</h2>
    <div class="spark-row"><span>Speed</span><div class="spark-track"><span style="width:84%"></span></div><strong>84</strong></div>
    <div class="spark-row"><span>Control</span><div class="spark-track"><span style="width:76%"></span></div><strong>76</strong></div>
    <div class="spark-row"><span>Effort</span><div class="spark-track"><span style="width:68%"></span></div><strong>68</strong></div>
    <div class="spark-row"><span>Visibility</span><div class="spark-track"><span style="width:91%"></span></div><strong>91</strong></div>
  </section>
  <section class="impact-panel">
    <h2>Operating balance</h2>
    <svg class="radar" viewBox="0 0 420 300" role="img" aria-label="Radar chart">
      <g fill="none" stroke="#dedede">
        <polygon points="210,28 366,118 306,260 114,260 54,118"/>
        <polygon points="210,76 320,139 278,236 142,236 100,139"/>
        <polygon points="210,124 274,160 250,212 170,212 146,160"/>
      </g>
      <polygon points="210,54 338,132 286,238 136,244 86,126" fill="rgba(15,130,245,.20)" stroke="#0f82f5" stroke-width="5"/>
      <g fill="#090909" font-family="Poppins, Aptos, sans-serif" font-size="14" font-weight="500">
        <text x="184" y="20">Speed</text>
        <text x="342" y="110">Control</text>
        <text x="286" y="286">Risk</text>
        <text x="74" y="286">Effort</text>
        <text x="10" y="110">Visibility</text>
      </g>
    </svg>
  </section>
</div>

---

<!-- layout: three-stat -->
<!-- eyebrow: EDITABLE PPTX HANDOFF -->
<!-- takeaway: The PowerPoint version gives leaders editable numbers and narrative, while HTML carries the richer data story. -->

# Editable summary for PowerPoint

<deck-stat-grid>
  <deck-stat value="42%" label="avoidable delay in two handoffs"></deck-stat>
  <deck-stat value="84" label="speed impact score"></deck-stat>
  <deck-stat value="91" label="visibility impact score"></deck-stat>
</deck-stat-grid>

The PPTX handoff keeps the core message editable without trying to flatten every HTML flourish into PowerPoint.

---

<!-- eyebrow: WHAT CHANGES -->
<!-- takeaway: Users can ask Claude to change the source, rerun the builder, and get new HTML/PPTX outputs. -->

# Users edit by asking, not dragging

<deck-next-steps>
  <deck-step title="Ask for the change"><p>Update the metric, add a segment, or rewrite the recommendation.</p></deck-step>
  <deck-step title="Regenerate the deck"><p>The bundled renderer rebuilds HTML and PPTX from the same Markdown.</p></deck-step>
  <deck-step title="Share the right artifact"><p>Use HTML for presentation impact and PPTX for editable business distribution.</p></deck-step>
</deck-next-steps>

---

<deck-close title="HTML for impact. PPTX for handoff." name="Jordan Lee" role="Customer Strategy"></deck-close>
