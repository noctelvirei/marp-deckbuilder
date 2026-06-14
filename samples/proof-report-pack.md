---
title: Proof Demo - Reporting Pack
presenter:
  name: Report Presenter
  role: Operations Analytics
---

<!-- layout: cover -->

# Monthly Operations Pack

Markdown in, HTML and editable PPTX out.

---

<deck-divider
  act="REPORT"
  title="May Performance."
  subtitle="A reporting deck generated from structured data components."
></deck-divider>

---

<!-- layout: three-stat -->
<!-- eyebrow: MONTHLY SCORECARD -->
<!-- takeaway: Reporting numbers can be supplied as compact component attributes instead of generated PPTX code. -->

# The month closed ahead of target

<deck-stat-grid>
  <deck-stat value="12,800" label="journeys completed"></deck-stat>
  <deck-stat value="92%" label="completed within SLA"></deck-stat>
  <deck-stat value="8.7/10" label="customer effort score"></deck-stat>
</deck-stat-grid>

Volume increased without creating a matching rise in ageing or exceptions.

---

<!-- layout: chart -->
<!-- eyebrow: VOLUME TREND -->
<!-- takeaway: The same chart data can be edited in PowerPoint after generation. -->

# Weekly volume stayed controlled

<deck-chart
  type="bar"
  title="Completed journeys by week"
  series="Journeys"
  labels="Week 1, Week 2, Week 3, Week 4, Week 5"
  values="2380, 2510, 2675, 2620, 2655"
></deck-chart>

---

<!-- layout: chart -->
<!-- eyebrow: SLA TREND -->
<!-- takeaway: Line charts are native PPTX charts, not static screenshots. -->

# SLA performance recovered mid-month

<deck-chart
  type="line"
  title="SLA completion rate"
  series="Percent"
  labels="Week 1, Week 2, Week 3, Week 4, Week 5"
  values="88, 89, 92, 94, 95"
></deck-chart>

---

<!-- layout: cards -->
<!-- eyebrow: DRIVERS -->
<!-- takeaway: Four-up card grids are editable and use the same brand definitions as HTML. -->

# What changed this month

<deck-card-grid columns="4">
  <deck-card title="Fewer blockers">
    <p>Evidence requests were clearer at the start of the journey.</p>
  </deck-card>
  <deck-card title="Better routing">
    <p>Exceptions moved to the right team sooner.</p>
  </deck-card>
  <deck-card title="Cleaner data">
    <p>Mandatory fields reduced incomplete submissions.</p>
  </deck-card>
  <deck-card title="Faster review">
    <p>Managers approved ready cases in shorter batches.</p>
  </deck-card>
</deck-card-grid>

---

<!-- eyebrow: RISK VIEW -->
<!-- takeaway: Comparison components are useful for status packs and management updates. -->

# Current risk posture

<deck-comparison left-title="Watch item" right-title="Mitigation">
  <deck-row label="Peak volume" left="Friday spikes remain visible" right="Pre-stage evidence checks earlier in week"></deck-row>
  <deck-row label="Ageing cases" left="Small tail over seven days" right="Daily exception queue review"></deck-row>
  <deck-row label="Data quality" left="Address fields still inconsistent" right="Tighten mandatory capture"></deck-row>
  <deck-row label="Audit trail" left="Manual notes vary by team" right="Use controlled status reasons"></deck-row>
</deck-comparison>

---

<!-- eyebrow: ACTION PLAN -->
<!-- takeaway: Numbered steps help the agent generate a practical close-out without spending tokens on layout. -->

# June focus

<deck-next-steps>
  <deck-step title="Lock the new intake fields"><p>Make the successful May fields standard across all teams.</p></deck-step>
  <deck-step title="Automate the ageing queue"><p>Trigger reminders and escalation before SLA risk appears.</p></deck-step>
  <deck-step title="Publish weekly controls"><p>Share the same scorecard every Monday with owners and actions.</p></deck-step>
</deck-next-steps>

---

<deck-close title="Questions" name="Report Presenter" role="Operations Analytics"></deck-close>
