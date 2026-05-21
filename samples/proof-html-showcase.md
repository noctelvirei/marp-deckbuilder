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
.impact-svg {
  background: #ffffff;
}
.bar-fill {
  animation: bar-in 900ms ease-out both;
  transform-box: fill-box;
  transform-origin: left center;
}
.radar-fill {
  filter: drop-shadow(0 16px 18px rgba(15, 130, 245, .18));
  animation: fade-up 900ms ease-out both;
}
@keyframes bar-in {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<!-- eyebrow: REPORT MODE -->
<!-- takeaway: Rich SVG visuals stay high fidelity in HTML and are embedded into PPTX without asking the model to draw PowerPoint shapes. -->

# The HTML version can behave like a mini report

<deck-visual title="Scenario operating model" caption="The PPTX version embeds this SVG as a crisp visual; use deck-chart when every data point must remain editable in PowerPoint.">
  <svg class="impact-svg" viewBox="0 0 920 360" role="img" aria-label="Combined workstream impact bars and radar chart">
    <rect x="0" y="0" width="920" height="360" rx="0" fill="#ffffff"/>
    <rect x="18" y="18" width="884" height="324" fill="#fdfdfd" stroke="#dedede"/>
    <text x="50" y="64" fill="#090909" font-family="Poppins, Aptos, sans-serif" font-size="24" font-weight="500">Workstream impact</text>
    <g font-family="Poppins, Aptos, sans-serif" font-size="15" fill="#090909">
      <text x="50" y="120">Speed</text>
      <rect x="178" y="104" width="250" height="18" fill="#eef6fe"/>
      <rect class="bar-fill" x="178" y="104" width="210" height="18" fill="#0f82f5"/>
      <text x="446" y="120" font-weight="500">84</text>
      <text x="50" y="170">Control</text>
      <rect x="178" y="154" width="250" height="18" fill="#eef6fe"/>
      <rect class="bar-fill" x="178" y="154" width="190" height="18" fill="#5143d5"/>
      <text x="446" y="170" font-weight="500">76</text>
      <text x="50" y="220">Effort</text>
      <rect x="178" y="204" width="250" height="18" fill="#eef6fe"/>
      <rect class="bar-fill" x="178" y="204" width="170" height="18" fill="#66cc8e"/>
      <text x="446" y="220" font-weight="500">68</text>
      <text x="50" y="270">Visibility</text>
      <rect x="178" y="254" width="250" height="18" fill="#eef6fe"/>
      <rect class="bar-fill" x="178" y="254" width="228" height="18" fill="#59d6fd"/>
      <text x="446" y="270" font-weight="500">91</text>
    </g>
    <text x="575" y="64" fill="#090909" font-family="Poppins, Aptos, sans-serif" font-size="24" font-weight="500">Operating balance</text>
    <g transform="translate(535 42)">
      <g fill="none" stroke="#dedede">
        <polygon points="170,28 326,118 266,260 74,260 14,118"/>
        <polygon points="170,76 280,139 238,236 102,236 60,139"/>
        <polygon points="170,124 234,160 210,212 130,212 106,160"/>
      </g>
      <polygon class="radar-fill" points="170,54 298,132 246,238 96,244 46,126" fill="rgba(15,130,245,.20)" stroke="#0f82f5" stroke-width="5"/>
      <g fill="#090909" font-family="Poppins, Aptos, sans-serif" font-size="14" font-weight="500">
        <text x="144" y="20">Speed</text>
        <text x="302" y="110">Control</text>
        <text x="246" y="286">Risk</text>
        <text x="34" y="286">Effort</text>
        <text x="-30" y="110">Visibility</text>
      </g>
    </g>
  </svg>
</deck-visual>

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
