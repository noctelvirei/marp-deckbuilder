---
title: Proof Demo - Executive Brief
presenter:
  name: Alex Morgan
  role: GTM Strategy
---

<!-- layout: cover -->

# Executive Brief Proof Deck

A compact deck generated from Markdown through the bundled skill renderer.

---

<deck-divider
  act="ACT 01"
  title="The Signal."
  subtitle="A concise executive narrative with editable PowerPoint output."
></deck-divider>

---

<!-- layout: three-stat -->
<!-- eyebrow: EXECUTIVE SNAPSHOT -->
<!-- takeaway: The bundled renderer turns compact Markdown components into editable PPTX shapes. -->

# The opportunity is concentrated in three areas

<deck-stat-grid>
  <deck-stat value="31%" label="avoidable rework"></deck-stat>
  <deck-stat value="4.2 days" label="median cycle time"></deck-stat>
  <deck-stat value="18%" label="cases missing evidence"></deck-stat>
</deck-stat-grid>

The current process is stable, but the handoffs slow down the moments where confidence matters most.

---

<!-- layout: cards -->
<!-- eyebrow: PRIORITIES -->
<!-- takeaway: Each recommendation stays editable because cards are native PPTX objects. -->

# Three actions to take first

<deck-card-grid columns="3">
  <deck-card title="Standardize intake">
    <p>Capture required fields, evidence, and consent before work begins.</p>
  </deck-card>
  <deck-card title="Expose status">
    <p>Give teams a shared view of what is waiting, blocked, or ready.</p>
  </deck-card>
  <deck-card title="Automate controls">
    <p>Move checks, reminders, and approvals into a repeatable workflow.</p>
  </deck-card>
</deck-card-grid>

---

<!-- eyebrow: OPTION TRADEOFF -->
<!-- takeaway: Comparison rows are generated as editable table-like objects. -->

# Build path comparison

<deck-comparison left-title="Manual build" right-title="Deckbuilder path">
  <deck-row label="Source format" left="Long prompt plus code" right="Short Markdown plus components"></deck-row>
  <deck-row label="Brand changes" left="Edit generation logic" right="Replace definition files"></deck-row>
  <deck-row label="PPTX quality" left="Varies by prompt" right="Deterministic component output"></deck-row>
  <deck-row label="Skill size" left="Heavy dependencies" right="Bundle-only payload"></deck-row>
  <deck-row label="Maintenance" left="Specialist code edits" right="Reusable source project"></deck-row>
</deck-comparison>

---

<!-- layout: chart -->
<!-- eyebrow: METRIC TREND -->
<!-- takeaway: Structured chart tags become native PowerPoint charts. -->

# Cycle time improved after workflow changes

<deck-chart
  type="line"
  title="Median cycle time by month"
  series="Days"
  labels="Jan, Feb, Mar, Apr, May"
  values="5.1, 4.8, 4.4, 4.2, 3.7"
></deck-chart>

---

<!-- eyebrow: OPERATING MODEL -->
<!-- takeaway: Swimlanes show how multi-team journeys can be rendered without hand-positioned PPTX code. -->

# A shared journey across teams

<deck-swimlane>
  <deck-lane title="Customer team" color="blue">
    <deck-step title="Invite"><p>Send secure journey.</p></deck-step>
    <deck-step title="Collect"><p>Receive evidence.</p></deck-step>
    <deck-step title="Check"><p>Review completeness.</p></deck-step>
    <deck-step title="Resolve"><p>Fix exceptions.</p></deck-step>
    <deck-step title="Approve"><p>Close the case.</p></deck-step>
  </deck-lane>
  <deck-lane title="Operations" color="purple">
    <deck-step title="Trigger"><p>Start workflow.</p></deck-step>
    <deck-step title="Monitor"><p>Track ageing.</p></deck-step>
    <deck-step title="Escalate"><p>Route blockers.</p></deck-step>
    <deck-step title="Audit"><p>Capture evidence.</p></deck-step>
    <deck-step title="Report"><p>Measure outcomes.</p></deck-step>
  </deck-lane>
</deck-swimlane>

---

<!-- eyebrow: PROOF POINT -->
<!-- takeaway: Proof slides combine stats, narrative context, source line, and optional logo area. -->

# Similar teams see measurable lift

<deck-proof
  customer="Reference customer"
  bridge="Prospect relevance: the same operating controls apply to high-volume service journeys."
  source="Source: sample operating benchmark, May 2026"
>
  <deck-stat value="44%" label="less manual follow-up"></deck-stat>
  <deck-stat value="2.1x" label="faster completion"></deck-stat>
  <deck-stat value="28%" label="fewer exceptions"></deck-stat>
  <p>A controlled workflow reduces status chasing while preserving the evidence trail that managers need.</p>
</deck-proof>

---

<!-- eyebrow: NEXT STEPS -->
<!-- takeaway: The close-out slide is built from a compact numbered component. -->

# Start with one measurable journey

<deck-next-steps>
  <deck-step title="Pick the journey"><p>Select one workflow with visible handoffs and measurable delay.</p></deck-step>
  <deck-step title="Define the evidence"><p>List required data, documents, checks, and approval points.</p></deck-step>
  <deck-step title="Run the proof"><p>Measure completion time, follow-up rate, and exception volume.</p></deck-step>
</deck-next-steps>

---

<deck-close title="Thank you" name="Alex Morgan" role="GTM Strategy"></deck-close>
