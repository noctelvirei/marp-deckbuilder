---
title: Marp Deckbuilder Demo
presenter:
  name: Jane Smith
  role: VP Solutions
---

<!-- layout: cover -->

# Marp Deckbuilder Demo

Rich HTML slides, editable PPTX text, and brand rules that live in a tool.

---

<deck-divider
  act="ACT 01"
  title="A Component Contract."
  subtitle="Known deck tags render to both rich HTML and native editable PowerPoint objects."
></deck-divider>

---

<!-- layout: three-stat -->
<!-- eyebrow: EXECUTIVE SNAPSHOT -->
<!-- takeaway: The wrapper keeps Marp's expressive authoring while moving PPTX mechanics into code. -->

# Three pressure points stand out

<deck-stat-grid>
  <deck-stat value="42%" label="manual handoffs"></deck-stat>
  <deck-stat value="3.8 days" label="average completion time"></deck-stat>
  <deck-stat value="27%" label="rework rate"></deck-stat>
</deck-stat-grid>

The process is workable, but slow at precisely the moments customers expect speed.

---

<!-- layout: cards -->
<!-- eyebrow: RECOMMENDATIONS -->
<!-- takeaway: The highest-value improvements are operational, not cosmetic. -->

# Where to focus first

<deck-card-grid columns="3">
  <deck-card title="Intake">
    <p>Standardize required data capture before work starts.</p>
  </deck-card>
  <deck-card title="Evidence">
    <p>Replace attachment loops with controlled document collection.</p>
  </deck-card>
  <deck-card title="Approval">
    <p>Route decisions through a visible, auditable flow.</p>
  </deck-card>
</deck-card-grid>

---

<!-- layout: chart -->
<!-- eyebrow: CHART EXAMPLE -->
<!-- takeaway: Charts are produced from structured data, so PowerPoint can edit the chart instead of flattening it. -->

# Completion time by channel

<deck-chart
  type="bar"
  title="Average completion time"
  series="Days"
  labels="Digital, Branch, Contact centre, Paper"
  values="2.1, 3.8, 4.6, 6.2"
></deck-chart>

---

<!-- eyebrow: BUILD OPTIONS -->
<!-- takeaway: Comparison grids are editable tables made from simple row data. -->

# Internal build vs. Deckbuilder

<deck-comparison left-title="Internal build" right-title="Deckbuilder">
  <deck-row label="Launch timeline" left="12-18 months before first production rollout" right="6-8 weeks to a governed pilot"></deck-row>
  <deck-row label="Maintenance" left="Owned by scarce internal engineering capacity" right="Product updates absorbed by the platform"></deck-row>
  <deck-row label="Compliance" left="Controls must be designed, tested, and audited from scratch" right="Reusable workflow, evidence, and audit patterns"></deck-row>
  <deck-row label="Customer experience" left="Varies across teams and channels" right="Consistent guided flows across journeys"></deck-row>
</deck-comparison>

---

<!-- eyebrow: ARCHITECTURE -->
<!-- takeaway: Swimlanes show parallel processes without forcing the author to draw boxes manually. -->

# Two-track operating flow

<deck-swimlane>
  <deck-lane title="HR onboarding" color="blue">
    <deck-step title="Invite"><p>Send secure journey link.</p></deck-step>
    <deck-step title="Capture"><p>Collect identity and evidence.</p></deck-step>
    <deck-step title="Validate"><p>Check required data.</p></deck-step>
    <deck-step title="Approve"><p>Route exceptions.</p></deck-step>
    <deck-step title="Archive"><p>Store audit trail.</p></deck-step>
  </deck-lane>
  <deck-lane title="Auto finance" color="purple">
    <deck-step title="Start"><p>Trigger dealer workflow.</p></deck-step>
    <deck-step title="Sign"><p>Capture e-signature.</p></deck-step>
    <deck-step title="Verify"><p>Confirm documents.</p></deck-step>
    <deck-step title="Fund"><p>Release decision.</p></deck-step>
    <deck-step title="Report"><p>Sync status.</p></deck-step>
  </deck-lane>
</deck-swimlane>

---

<!-- eyebrow: PROOF -->
<!-- takeaway: Proof slides combine editable stats, customer relevance, and source metadata. -->

# The pattern is already proven

<deck-proof
  customer="Example Bank"
  bridge="Prospect relevance: the same controls apply to high-volume onboarding journeys."
  source="Source: sample operating metrics, May 2026"
>
  <deck-stat value="55%" label="less manual handling"></deck-stat>
  <deck-stat value="2.4x" label="faster document completion"></deck-stat>
  <deck-stat value="31%" label="fewer avoidable follow-ups"></deck-stat>
  <p>Teams see the strongest gains when document capture, consent, and exception handling move into a single guided workflow.</p>
</deck-proof>

---

<!-- eyebrow: TRUSTED BY -->
<!-- takeaway: Logo walls use real images when available and fall back to editable text tiles when not. -->

# Trusted by financial services teams

<deck-logo-wall>
  <deck-logo name="Bank A"></deck-logo>
  <deck-logo name="Auto Finance Co."></deck-logo>
  <deck-logo name="Bank B"></deck-logo>
  <deck-logo name="Bank C"></deck-logo>
  <deck-logo name="Lender A"></deck-logo>
  <deck-logo name="Auto Finance Group"></deck-logo>
  <deck-logo name="Bank D"></deck-logo>
  <deck-logo name="Lender B"></deck-logo>
  <deck-logo name="Lender C"></deck-logo>
  <deck-logo name="Global Lender"></deck-logo>
  <deck-logo name="Digital Bank"></deck-logo>
  <deck-logo name="Retail Finance Co."></deck-logo>
</deck-logo-wall>

---

<!-- eyebrow: NEXT STEPS -->
<!-- takeaway: Next-step slides are editable row cards with numbered badges. -->

# Recommended next steps

<deck-next-steps>
  <deck-step title="Confirm the target journey"><p>Pick one high-volume process with measurable delay, rework, or leakage.</p></deck-step>
  <deck-step title="Map evidence and controls"><p>List the documents, approvals, and audit events the journey must capture.</p></deck-step>
  <deck-step title="Run a governed pilot"><p>Use the first pilot to prove speed, completion, and control quality.</p></deck-step>
</deck-next-steps>

---

<deck-divider
  act="ACT 02"
  title="The Ask."
  subtitle="Move from slide generation to repeatable report-to-deck production."
></deck-divider>

---

<deck-close
  title="Thank you"
  name="Jane Smith"
  role="VP Solutions"
></deck-close>
