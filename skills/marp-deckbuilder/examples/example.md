---
title: Marp Deckbuilder Example
presenter:
  name: Jane Smith
  role: VP Solutions
---

<!-- layout: cover -->

# Marp Deckbuilder Example

Editable PPTX generated from compact component Markdown.

---

<deck-divider
  act="ACT 01"
  title="The Opportunity."
  subtitle="A concise story generated from report or customer context."
></deck-divider>

---

<!-- eyebrow: EXECUTIVE SNAPSHOT -->
<!-- takeaway: Native components keep the deck editable while preserving the brand system. -->

# Three signals stand out

<deck-stat-grid>
  <deck-stat value="42%" label="manual handoffs"></deck-stat>
  <deck-stat value="3.8 days" label="average completion time"></deck-stat>
  <deck-stat value="27%" label="rework rate"></deck-stat>
</deck-stat-grid>

---

<!-- pptx: skip -->
<!-- eyebrow: PREMIUM HTML -->

# The concentration story

<style scoped>
.signal-board { display:grid; grid-template-columns:0.72fr 1.28fr; gap:28px; align-items:stretch; margin-top:24px; }
.signal-card { padding:28px; border:1px solid #1e3a5f; background:#0d1d36; }
.signal-card strong { display:block; color:#0f82f5; font-size:72px; font-weight:500; line-height:1; }
.signal-card span { display:block; margin-top:14px; color:#c8d8f0; font-size:18px; line-height:1.35; }
.signal-svg { width:100%; height:332px; border:1px solid #1e3a5f; background:#071228; }
</style>

<div class="signal-board">
  <div class="signal-card">
    <strong>97%</strong>
    <span>of volume is concentrated in the two largest segments, making the operating story easy to explain.</span>
  </div>
  <svg class="signal-svg" viewBox="0 0 640 332" role="img" aria-label="Premium HTML concentration chart">
    <defs>
      <linearGradient id="barA" x1="0" x2="1"><stop stop-color="#0f82f5"/><stop offset="1" stop-color="#59d6fd"/></linearGradient>
      <linearGradient id="barB" x1="0" x2="1"><stop stop-color="#5143d5"/><stop offset="1" stop-color="#59d6fd"/></linearGradient>
      <filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#59d6fd" flood-opacity=".35"/></filter>
    </defs>
    <text x="38" y="54" fill="#ffffff" font-family="Poppins, Segoe UI, sans-serif" font-size="25" font-weight="500">Volume split</text>
    <text x="38" y="84" fill="#8b9ab5" font-family="Poppins, Segoe UI, sans-serif" font-size="15">A richer browser view can carry annotations, gradients, and precise emphasis.</text>
    <g font-family="Poppins, Segoe UI, sans-serif" font-size="17">
      <text x="38" y="144" fill="#c8d8f0">Segment A</text>
      <rect x="160" y="122" width="390" height="30" fill="#0d1d36"/>
      <rect x="160" y="122" width="254" height="30" fill="url(#barA)" filter="url(#glow)"/>
      <text x="428" y="144" fill="#ffffff">65%</text>
      <text x="38" y="208" fill="#c8d8f0">Segment B</text>
      <rect x="160" y="186" width="390" height="30" fill="#0d1d36"/>
      <rect x="160" y="186" width="125" height="30" fill="url(#barB)"/>
      <text x="300" y="208" fill="#ffffff">32%</text>
      <text x="38" y="272" fill="#c8d8f0">Long tail</text>
      <rect x="160" y="250" width="390" height="30" fill="#0d1d36"/>
      <rect x="160" y="250" width="12" height="30" fill="#66cc8e"/>
      <text x="188" y="272" fill="#ffffff">3%</text>
    </g>
  </svg>
</div>

---

<!-- html: skip -->
<!-- eyebrow: PPTX FALLBACK -->
<!-- takeaway: The PPTX fallback remains editable, while HTML carries the premium visual treatment. -->

# Concentration summary

<deck-chart
  type="bar"
  title="Volume split"
  labels="Segment A, Segment B, Long tail"
  values="65, 32, 3"
></deck-chart>

---

<!-- eyebrow: NEXT STEPS -->
<!-- takeaway: Keep recommendations action-oriented and measurable. -->

# Recommended next steps

<deck-next-steps>
  <deck-step title="Confirm the target journey"><p>Pick one high-volume process with measurable delay or rework.</p></deck-step>
  <deck-step title="Map evidence and controls"><p>List documents, approvals, and audit events.</p></deck-step>
  <deck-step title="Run a governed pilot"><p>Use the first pilot to prove speed, completion, and control quality.</p></deck-step>
</deck-next-steps>

---

<deck-close title="Thank you" name="Jane Smith" role="VP Solutions"></deck-close>
