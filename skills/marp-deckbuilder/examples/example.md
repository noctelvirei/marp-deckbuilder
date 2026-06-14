---
title: Marp Deckbuilder Example
customerName: SampleBank
customerLogo: resource:logos/sample-customer.svg
presenter:
  name: Jane Smith
  role: VP Solutions
---

<deck-slide layout="cover" />

# Marp Deckbuilder Example

Editable PPTX generated from compact component Markdown.

---

<deck-divider
  act="ACT 01"
  title="The Opportunity."
  subtitle="A concise story generated from briefing or customer context."
></deck-divider>

---

<deck-slide
  surface="light"
  eyebrow="EXECUTIVE SNAPSHOT"
  takeaway="Native components keep the deck editable while preserving the brand system."
  animation="enter-fade"
  animation-trigger="after-previous"
  animation-duration="1500"
  animation-delay="250"
/>

# Three signals stand out

<deck-stat-grid>
  <deck-stat value="42%" label="manual handoffs"></deck-stat>
  <deck-stat value="3.8 days" label="average completion time"></deck-stat>
  <deck-stat value="27%" label="rework rate"></deck-stat>
</deck-stat-grid>

---

<deck-slide
  eyebrow="CARD MEDIA"
  takeaway="Cards can still include renderer-owned icons and images via attributes."
  animation="enter-appear"
  animation-trigger="after-previous"
  animation-delay="250"
/>

# Card media stays structured

<deck-card-grid columns="3">
  <deck-card title="Invite" icon="sample-card-icon" icon-alt="Sample card icon"><p>Start the secure journey.</p></deck-card>
  <deck-card title="Customer logo" image="logos/sample-customer.svg" image-alt="SampleBank logo"><p>Use explicit resource images in card slots.</p></deck-card>
  <deck-card title="Signed pack" src="resource:logos/sample-customer.svg" alt="SampleBank mark"><p>Use src when the path is already a resource URL.</p></deck-card>
</deck-card-grid>

---

<deck-slide eyebrow="PREMIUM SIGNAL" takeaway="The same structured component renders in HTML and editable PPTX." />

# The concentration story

<deck-signal-bars
  metric="97%"
  metric-label="of volume is concentrated in the two largest segments, making the operating story easy to explain."
  title="Volume split"
  subtitle="A renderer-owned component carries the annotation, panels, and precise emphasis."
  labels="Segment A, Segment B, Long tail"
  values="65, 32, 3"
  unit="%"
></deck-signal-bars>

---

<deck-slide eyebrow="SIGNAL BOARD" takeaway="Use deck-signal-board when the slide needs narrative copy, tag pills, and bars." />

# Narrative signal board

<deck-signal-board
  title="Executive signal"
  body="The renderer output can carry dashboard, callout, and narrative reporting patterns without raw layout HTML."
  tags="Revenue protection, Journey speed, Audit confidence"
  chart-title="Signal strength"
  labels="Speed, Control, Effort"
  values="82, 74, 63"
></deck-signal-board>

---

<deck-slide eyebrow="BAR CHART" takeaway="Use bar charts for ranked categorical comparisons with one value per label." />

# Average completion time

<deck-chart
  type="bar"
  title="Completion time by channel"
  series="Days"
  labels="Digital, Branch, Contact centre, Paper"
  values="2.1, 3.8, 4.6, 5.2"
></deck-chart>

---

<deck-slide eyebrow="LINE CHART" takeaway="Use line charts for simple time-series movement with one value per label." />

# Completion rate trend

<deck-chart
  type="line"
  title="Weekly completion rate"
  series="Completion"
  labels="W1, W2, W3, W4, W5, W6"
  values="68, 72, 74, 79, 83, 88"
></deck-chart>

---

<deck-slide eyebrow="AREA CHART" takeaway="Use area charts for cumulative or volume-over-time movement where magnitude matters." />

# Monthly adoption trend

<deck-chart
  type="area"
  title="Monthly adoption"
  series="Users"
  points="Jan:18, Feb:24, Mar:31, Apr:44, May:58, Jun:72"
></deck-chart>

---

<deck-slide eyebrow="WATERFALL CHART" takeaway="Use waterfall charts for sequential positive and negative movement from a starting point." />

# Monthly movement bridge

<deck-chart
  type="waterfall"
  title="Monthly movement"
  series="Cases"
  labels="Opening, New cases, Exceptions, Recoveries"
  values="52000, 6400, -1200, 3750"
></deck-chart>

---

<deck-slide eyebrow="BULLET CHART" takeaway="Use bullet charts to compare current performance against target markers." />

# SLA target attainment

<deck-chart
  type="bullet"
  title="SLA attainment"
  series="Actual"
  labels="Digital, Assisted, Exceptions"
  values="92, 84, 63"
  targets="95, 90, 75"
></deck-chart>

---

<deck-slide eyebrow="GROUPED CHART" takeaway="Use grouped-bar charts when two or more series need direct comparison across the same labels." />

# Quarterly conversion comparison

<deck-chart
  type="grouped-bar"
  title="Conversion by quarter"
  series="Current, Target"
  labels="Q1, Q2, Q3, Q4"
  values="42, 58, 63, 71; 50, 60, 70, 78"
></deck-chart>

---

<deck-slide eyebrow="STACKED CHART" takeaway="Use stacked-bar charts for part-to-whole composition across repeated labels." />

# Quarterly volume mix

<deck-chart
  type="stacked-bar"
  title="Volume mix by quarter"
  series="New, Returning, Expansion"
  labels="Q1, Q2, Q3, Q4"
  values="20, 24, 30, 34; 12, 15, 18, 22; 4, 6, 9, 11"
></deck-chart>

---

<deck-slide eyebrow="DOUGHNUT CHART" takeaway="Use doughnut charts for compact composition stories with editable PPTX output." />

# Portfolio channel mix

<deck-chart
  type="doughnut"
  title="Case mix by channel"
  series="Cases"
  labels="Digital, Branch, Contact centre, Paper"
  values="52, 31, 13, 4"
></deck-chart>

---

<deck-slide eyebrow="SCATTER CHART" takeaway="Use scatter charts for impact-versus-effort or value-versus-risk analysis without raw SVG." />

# Initiative impact profile

<deck-chart
  type="scatter"
  title="Impact versus effort"
  series="Initiatives"
  x-axis="Effort"
  y-axis="Impact"
  points="2|8|Automate; 4|7|Standardise; 6|5|Integrate; 8|3|Defer"
></deck-chart>

---

<deck-slide eyebrow="BUBBLE CHART" takeaway="Use bubble charts when x/y position and magnitude all matter on the same slide." />

# Journey impact by effort

<deck-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-axis="Touches"
  y-axis="Completion"
  points="2:93:10, 4:88:14, 7:72:18, 9:61:9"
></deck-chart>

---

<deck-slide eyebrow="HISTOGRAM" takeaway="Use histogram charts for raw numeric distributions without pre-binning the data." />

# Response time distribution

<deck-chart
  type="histogram"
  title="Response time distribution"
  series="Cases"
  values="1.2, 1.8, 2.1, 2.4, 2.8, 3.3, 3.7, 4.1, 4.6, 5.2, 5.8, 6.3"
  bins="6"
></deck-chart>

---

<deck-slide eyebrow="BOXPLOT" takeaway="Use boxplot charts when spread and median matter more than a single average." />

# Cycle time spread

<deck-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-axis="Days"
  labels="Digital, Assisted, Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></deck-chart>

---

<deck-slide eyebrow="PARETO" takeaway="Use Pareto charts for ranked drivers and cumulative share without authored JavaScript." />

# Exception drivers

<deck-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  labels="Identity, Address, Income, Consent"
  values="42, 18, 27, 13"
></deck-chart>

---

<deck-slide eyebrow="SANKEY" takeaway="Use Sankey charts for acyclic source-to-target flow stories without D3 in Markdown." />

# Journey flow

<deck-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  links="Opened>Started:44120, Started>Completed:37980, Started>Exception:3751, Exception>Recovered:2160"
></deck-chart>

---

<deck-slide eyebrow="IMPACT RADAR" takeaway="Use deck-impact-radar for a combined impact bar profile and radar balance view." />

# Workstream impact profile

<deck-impact-radar
  title="Scenario operating model"
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
  radar-values="84, 76, 68, 91"
  caption="Renderer-owned SVG in HTML and static SVG in PPTX."
></deck-impact-radar>

---

<deck-slide eyebrow="FUNNEL" takeaway="Use structured funnel stages instead of raw SVG or CSS bars." />

# Completion funnel

<deck-funnel
  title="Journey completion"
  labels="Invited, Started, Completed"
  values="8420, 6568, 5136"
></deck-funnel>

---

<deck-slide eyebrow="OPERATING SIGNAL" takeaway="Use deck-metric-trend for a headline KPI plus short trend line." />

# Operating signal

<deck-metric-trend
  metric="92%"
  metric-label="completed within SLA"
  title="Weekly trend"
  labels="W1, W2, W3, W4, W5"
  values="70, 78, 76, 86, 92"
  unit="%"
></deck-metric-trend>

---

<deck-slide eyebrow="HEATMAP" takeaway="Use deck-heatmap for intensity grids without authored JavaScript." />

# Activity heatmap

<deck-heatmap
  title="Case activity by hour"
  x-labels="08, 09, 10, 11, 12, 13"
  y-labels="Mon, Tue, Wed, Thu, Fri"
  values="42, 58, 76, 64, 51, 39; 35, 61, 88, 72, 69, 54; 50, 66, 94, 81, 70, 62; 44, 59, 79, 86, 73, 57; 31, 47, 68, 75, 63, 49"
  unit=""
  caption="Darker cells represent higher activity."
></deck-heatmap>

---

<deck-slide eyebrow="TREEMAP" takeaway="Use deck-treemap for composition stories without authored D3." />

# Portfolio treemap

<deck-treemap
  title="Case volume mix"
  labels="J0107, J0106, J0101, J0116, Other"
  values="52208, 11119, 8648, 3751, 2225"
  unit=" cases"
  caption="Tile area is proportional to case volume."
></deck-treemap>

---

<deck-slide eyebrow="JOURNEY MAP" takeaway="Use structured journey steps instead of hand-authored HTML cards." />

# Customer journey

<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start the secure journey."></deck-journey-step>
  <deck-journey-step label="02" title="Capture" body="Collect evidence and consent."></deck-journey-step>
  <deck-journey-step label="03" title="Review" body="Check completeness."></deck-journey-step>
  <deck-journey-step label="04" title="Resolve" body="Fix exceptions."></deck-journey-step>
  <deck-journey-step label="05" title="Approve" body="Close the case."></deck-journey-step>
</deck-journey-map>

---

<deck-slide eyebrow="JOURNEY PATH" takeaway="Use deck-journey-path for a metric-led path diagram with renderer-owned SVG." />

# Journey delay path

<deck-journey-path
  metric="42%"
  metric-label="of avoidable delay sits in two handoffs. The slide can show the journey, not just describe it."
  labels="Invite, Evidence, Approval, Complete"
  notes="fast start, largest rework loop, decision queue, customer notified"
  hotspots="Evidence, Approval"
  callout-title="Recommended intervention"
  callout-body="Automated reminders plus controlled evidence checks"
></deck-journey-path>

---

<deck-slide eyebrow="NEXT STEPS" takeaway="Keep recommendations action-oriented and measurable." />

# Recommended next steps

<deck-next-steps>
  <deck-step title="Confirm the target journey"><p>Pick one high-volume process with measurable delay or rework.</p></deck-step>
  <deck-step title="Map evidence and controls"><p>List documents, approvals, and audit events.</p></deck-step>
  <deck-step title="Run a governed pilot"><p>Use the first pilot to prove speed, completion, and control quality.</p></deck-step>
</deck-next-steps>

---

<deck-close title="Thank you" name="Jane Smith" role="VP Solutions"></deck-close>
