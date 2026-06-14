---
title: Deckbuilder Capability Showcase
customerName: SampleBank
customerLogo: resource:logos/sample-customer.svg
presenter:
  name: Codex
  role: Deck Skill Showcase
---

<deck-slide layout="cover" />

# Deckbuilder Capability Showcase

A tasteful tour of the HTML presenter, native PPTX handoff, controlled animations, executive layouts, chart types, and renderer-backed slide components.

---

<deck-slide
  eyebrow="SHOWCASE MAP"
  takeaway="The same Markdown source can produce a polished browser deck and a practical editable PowerPoint handoff."
  animation="enter-fade"
  animation-trigger="after-previous"
  animation-duration="700"
/>

# One source now covers the main deck families

<deck-stat-grid>
  <deck-stat value="16" label="controlled entrance animations"></deck-stat>
  <deck-stat value="14" label="structured chart types"></deck-stat>
  <deck-stat value="9" label="premium renderer-backed visuals"></deck-stat>
</deck-stat-grid>

The showcase uses compact component Markdown so the renderer owns brand chrome, surface choices, animation metadata, and PPTX geometry.

---

<deck-divider
  label="Executive Surfaces"
  title="Large-format narrative slides now work on dark and light surfaces."
  subtitle="Use executive components when the deck needs stronger hierarchy than normal content slides."
></deck-divider>

---

<deck-exec-title
  surface="dark"
  eyebrow="EXECUTIVE TITLE"
  title="A strong opening can stay editable."
  subtitle="Oversized hierarchy, controlled brand chrome, and PowerPoint-safe text are generated from one component."
></deck-exec-title>

---

<deck-exec-rows
  surface="light"
  side-title="Why it matters"
  side-value="3"
  side-body="Story, layout, and output mechanics stay separate."
  takeaway="Executive row stacks are useful for strategy shifts, operating models, and board-level proof."
>
  <deck-exec-row label="01" kicker="Story" title="Claims stay visible" body="Every row carries a point, not a placeholder topic." accent="blue"></deck-exec-row>
  <deck-exec-row label="02" kicker="System" title="Brand stays centralized" body="Definitions drive colour, typography, surfaces, and logo placement." accent="purple"></deck-exec-row>
  <deck-exec-row label="03" kicker="Handoff" title="PPTX remains useful" body="The output is built from editable text, shapes, charts, and component fallbacks." accent="green"></deck-exec-row>
></deck-exec-rows>

---

<deck-exec-cards
  surface="dark"
  columns="4"
  target="Capability loop"
  takeaway="Four-card executive layouts are best for loops, vectors, and short operating choices."
>
  <deck-exec-card label="01" title="Author" metric="MD" subtitle="Markdown source" body="Write concise component tags instead of drawing slides by hand." accent="blue"></deck-exec-card>
  <deck-exec-card label="02" title="Render" metric="HTML" subtitle="Browser deck" body="Use the rich presenter for motion, SVG, and crisp visual storytelling." accent="purple"></deck-exec-card>
  <deck-exec-card label="03" title="Export" metric="PPTX" subtitle="Editable handoff" body="Generate PowerPoint files with native shapes and chart parts where possible." accent="green"></deck-exec-card>
  <deck-exec-card label="04" title="Reuse" metric="Skill" subtitle="Portable bundle" body="Ship a repeatable deck builder instead of a one-off prompt recipe." accent="orange"></deck-exec-card>
></deck-exec-cards>

---

<deck-exec-timeline
  surface="light"
  takeaway="Timelines provide a clean chapter rhythm without manual line drawing."
>
  <deck-exec-milestone year="Input" title="Source material" body="Markdown, component data, and resource references carry the intent." accent="blue"></deck-exec-milestone>
  <deck-exec-milestone year="System" title="Renderer contract" body="Validation catches unknown tags, invalid charts, missing assets, and unsupported animation names." accent="purple"></deck-exec-milestone>
  <deck-exec-milestone year="Output" title="Browser and PPTX" body="HTML is built for presentation impact; PowerPoint is built for business editing." accent="green"></deck-exec-milestone>
></deck-exec-timeline>

---

<deck-exec-metrics
  surface="dark"
  section-title="Output contract"
  takeaway="The handoff is not a screenshot deck; the useful objects remain editable."
>
  <deck-exec-metric value="HTML" label="Self-contained browser presenter"></deck-exec-metric>
  <deck-exec-metric value="PPTX" label="Native editable PowerPoint"></deck-exec-metric>
  <deck-exec-panel value="Fast" title="Validation path" body="The test suite checks parsing, HTML rendering, PPTX package contents, animations, branding, and reports."></deck-exec-panel>
  <deck-exec-panel value="Strict" title="Authoring guardrail" body="Unsupported raw HTML and retired visual escape hatches fail loudly." accent="yellow"></deck-exec-panel>
></deck-exec-metrics>

---

<deck-divider
  label="Animation Suite"
  title="Controlled entrances are now part of the deck contract."
  subtitle="The dedicated animation deck built with this showcase contains every supported entrance."
></deck-divider>

---

<deck-slide
  eyebrow="CLICK BUILD"
  takeaway="On-click stagger splits bullet pacing in HTML and PPTX."
  animation="enter-fade"
  animation-trigger="on-click"
  animation-duration="500"
  animation-sequence="stagger"
/>

# Clicker pacing survives the export

- Confirm the narrative spine.
- Choose the right component family.
- Build HTML for presentation impact.
- Hand off PPTX for editable review.

---

<deck-slide
  eyebrow="MOTION RANGE"
  takeaway="Subtle fades should be the default; mask and motion entrances are available when the story benefits."
  animation="enter-wipe"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="100"
/>

# The full animation suite is available separately

<deck-card-grid columns="4">
  <deck-card title="Subtle"><p>Appear, fade, dissolve.</p></deck-card>
  <deck-card title="Directional"><p>Fly, wipe, peek, strips.</p></deck-card>
  <deck-card title="Geometric"><p>Zoom, split, box, diamond, circle.</p></deck-card>
  <deck-card title="Textured"><p>Wheel, blinds, checkerboard, random bars.</p></deck-card>
></deck-card-grid>

---

<deck-divider
  label="Chart Atlas"
  title="Every supported deck chart type builds to browser and PPTX."
  subtitle="Native chart types stay editable where the PowerPoint engine supports them; specialized visuals use renderer-owned SVG."
></deck-divider>

---

<deck-slide
  eyebrow="CHART: BAR"
  takeaway="Use bars for simple categorical comparison with direct values."
/>

# Digital journeys complete fastest

<deck-chart
  type="bar"
  title="Average completion time"
  series="Days"
  labels="Digital, Branch, Contact centre, Paper"
  values="2.1, 3.8, 4.6, 6.2"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: LINE"
  takeaway="Use a line chart when order and direction matter more than composition."
/>

# Completion improved week by week

<deck-chart
  type="line"
  title="Weekly completion rate"
  series="Completion"
  labels="W1, W2, W3, W4, W5, W6"
  values="68, 72, 74, 79, 83, 88"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: AREA"
  takeaway="Use area charts for cumulative adoption or volume stories."
/>

# Adoption is compounding through the quarter

<deck-chart
  type="area"
  title="Monthly adoption"
  series="Users"
  points="Jan:18, Feb:24, Mar:31, Apr:44, May:57"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: GROUPED BAR"
  takeaway="Grouped bars make target gaps and side-by-side comparisons clear."
/>

# Conversion is ahead of plan in later quarters

<deck-chart
  type="grouped-bar"
  title="Quarterly conversion"
  series="Current, Target"
  labels="Q1, Q2, Q3, Q4"
  values="42, 58, 63, 71; 50, 60, 70, 78"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: STACKED BAR"
  takeaway="Stacked bars show how mix changes as total volume grows."
/>

# Expansion volume is becoming visible

<deck-chart
  type="stacked-bar"
  title="Quarterly volume mix"
  series="New, Returning, Expansion"
  labels="Q1, Q2, Q3, Q4"
  values="20, 24, 30, 34; 12, 15, 18, 22; 4, 6, 9, 11"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: DOUGHNUT"
  takeaway="Doughnuts work for compact part-to-whole reads with few categories."
/>

# Digital is now the largest channel

<deck-chart
  type="doughnut"
  title="Portfolio mix"
  series="Cases"
  labels="Digital, Branch, Contact centre"
  values="52, 31, 17"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: SCATTER"
  takeaway="Scatter plots separate attractive initiatives from expensive distractions."
/>

# The highest-impact work is not the heaviest

<deck-chart
  type="scatter"
  title="Impact versus effort"
  series="Initiatives"
  x-axis="Effort"
  y-axis="Impact"
  points="2|8|Automate; 5|6|Consolidate; 8|3|Defer; 3|7|Standardize"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: BUBBLE"
  takeaway="Bubble charts add magnitude when point size carries meaning."
/>

# High-volume journeys cluster near simple fixes

<deck-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-axis="Touches"
  y-axis="Completion"
  points="2:93:10, 4:88:14, 7:72:18, 9:61:9"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: WATERFALL"
  takeaway="Waterfalls explain movement from opening balance to final outcome."
/>

# Recovery offsets most new exceptions

<deck-chart
  type="waterfall"
  title="Monthly movement"
  series="Cases"
  labels="Opening, New cases, Exceptions, Recoveries"
  values="52000, 6400, -1200, 3750"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: BULLET"
  takeaway="Bullet charts compare actuals to targets without wasting space."
/>

# Exceptions remain below the target band

<deck-chart
  type="bullet"
  title="SLA attainment"
  series="Actual"
  labels="Digital, Assisted, Exceptions"
  values="92, 84, 63"
  targets="95, 90, 75"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: HISTOGRAM"
  takeaway="Histograms are built from raw observations, not pre-binned labels."
/>

# Most responses now land under four days

<deck-chart
  type="histogram"
  title="Response time distribution"
  series="Cases"
  values="1.2, 1.8, 2.1, 2.4, 2.8, 3.3, 3.7, 4.1, 4.6, 5.2, 5.8, 6.3"
  bins="6"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: BOXPLOT"
  takeaway="Boxplots show spread, median, and outlier risk for repeated processes."
/>

# Exception journeys carry the widest spread

<deck-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-axis="Days"
  labels="Digital, Assisted, Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: PARETO"
  takeaway="Pareto charts rank the drivers and draw the cumulative share."
/>

# Identity and income drive most exceptions

<deck-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  labels="Identity, Address, Income, Consent"
  values="42, 18, 27, 13"
></deck-chart>

---

<deck-slide
  eyebrow="CHART: SANKEY"
  takeaway="Sankey charts map acyclic flows through a journey."
/>

# Started journeys mostly reach completion

<deck-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  links="Opened>Started:44120, Started>Completed:37980, Started>Exception:3751, Exception>Recovered:2160"
></deck-chart>

---

<deck-divider
  label="Premium Components"
  title="Renderer-backed visuals carry higher-fidelity browser stories."
  subtitle="Each component has a PPTX-safe representation so the message survives the handoff."
></deck-divider>

---

<deck-slide
  eyebrow="SIGNAL BOARD"
  takeaway="A narrative panel plus signal bars keeps an executive dashboard readable."
/>

# The operating signal is positive but uneven

<deck-signal-board
  title="Executive signal"
  body="Speed and visibility are strong; effort still needs process cleanup before the next rollout."
  tags="Revenue protection, Journey speed, Audit confidence"
  chart-title="Signal strength"
  labels="Speed, Visibility, Effort"
  values="84, 91, 63"
></deck-signal-board>

---

<deck-slide
  eyebrow="SIGNAL BARS"
  takeaway="Contribution bars are best when one headline metric frames the distribution."
/>

# Two journeys carry nearly all volume

<deck-signal-bars
  metric="97%"
  metric-label="of volume is concentrated in the two largest segments."
  title="Volume split"
  subtitle="The long tail matters operationally, but not equally."
  labels="Renewals, New accounts, Long tail"
  values="61, 36, 3"
  unit="%"
></deck-signal-bars>

---

<deck-slide
  eyebrow="FUNNEL"
  takeaway="Funnels show stage conversion and drop-off with compact data."
/>

# Completion is healthy after customers start

<deck-funnel
  title="Completion funnel"
  labels="Invited, Started, Completed, Signed"
  values="8420, 6568, 5136, 4920"
></deck-funnel>

---

<deck-slide
  eyebrow="METRIC TREND"
  takeaway="Metric trends pair a headline KPI with a short history."
/>

# SLA attainment finished the month above plan

<deck-metric-trend
  metric="92%"
  metric-label="completed within SLA"
  title="Weekly trend"
  labels="W1, W2, W3, W4, W5"
  values="70, 78, 76, 86, 92"
  unit="%"
></deck-metric-trend>

---

<deck-slide
  eyebrow="HEATMAP"
  takeaway="Heatmaps expose intensity patterns without needing raw chart code."
/>

# Midweek mornings carry the heaviest load

<deck-heatmap
  title="Activity by hour"
  x-labels="08, 09, 10, 11, 12, 13"
  y-labels="Mon, Tue, Wed, Thu"
  values="42, 58, 76, 64, 51, 47; 35, 61, 88, 72, 59, 53; 50, 66, 94, 81, 68, 61; 41, 57, 78, 70, 60, 55"
  unit=" cases"
  caption="Darker cells represent higher activity."
></deck-heatmap>

---

<deck-slide
  eyebrow="IMPACT RADAR"
  takeaway="Impact radar combines ranked bars and operating-balance context."
/>

# Visibility is strong, but effort remains the constraint

<deck-impact-radar
  title="Scenario operating model"
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
  radar-values="84, 76, 68, 91"
  caption="The PPTX version embeds this renderer-owned visual as a crisp SVG."
></deck-impact-radar>

---

<deck-slide
  eyebrow="TREEMAP"
  takeaway="Treemaps make portfolio concentration visible at a glance."
/>

# One journey dominates the portfolio

<deck-treemap
  title="Portfolio mix"
  labels="J0107, J0106, J0101, J0116, J0124"
  values="52208, 11119, 8648, 3751, 2410"
  unit=" cases"
  caption="Tile area is proportional to case volume."
></deck-treemap>

---

<deck-slide
  eyebrow="JOURNEY MAP"
  takeaway="Journey cards are better than freehand boxes for process stages."
/>

# The core customer journey has four accountable moments

<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start the secure journey." accent="blue"></deck-journey-step>
  <deck-journey-step label="02" title="Capture" body="Collect evidence and consent." accent="purple"></deck-journey-step>
  <deck-journey-step label="03" title="Review" body="Check completeness and policy fit." accent="green"></deck-journey-step>
  <deck-journey-step label="04" title="Complete" body="Notify the customer and archive evidence." accent="orange"></deck-journey-step>
></deck-journey-map>

---

<deck-slide
  eyebrow="JOURNEY PATH"
  takeaway="The journey path component carries hotspots and an intervention callout."
/>

# Avoidable delay sits in two handoffs

<deck-journey-path
  metric="42%"
  metric-label="of avoidable delay sits in two handoffs."
  labels="Invite, Evidence, Approval, Complete"
  notes="fast start, largest rework loop, decision queue, customer notified"
  hotspots="Evidence, Approval"
  callout-title="Recommended intervention"
  callout-body="Automated reminders plus controlled evidence checks."
></deck-journey-path>

---

<deck-divider
  label="Business Handoff"
  title="Normal business slides stay concise and editable."
  subtitle="Cards, comparisons, swimlanes, proof slides, logo walls, and next steps cover the common operating deck."
></deck-divider>

---

<deck-slide
  eyebrow="CARD GRID"
  takeaway="Use cards for short recommendation sets; avoid turning every slide into a card grid."
/>

# Three actions move the system fastest

<deck-card-grid columns="3">
  <deck-card title="Standardize intake" icon="sample-card-icon"><p>Capture required fields, evidence, and consent before work begins.</p></deck-card>
  <deck-card title="Expose status"><p>Give teams a shared view of what is waiting, blocked, or ready.</p></deck-card>
  <deck-card title="Automate controls"><p>Move checks, reminders, and approvals into a repeatable workflow.</p></deck-card>
></deck-card-grid>

---

<deck-slide
  eyebrow="COMPARISON"
  takeaway="Comparison rows are editable table-like objects generated from compact data."
/>

# Component output beats one-off drawing

<deck-comparison left-title="Manual slide work" right-title="Deckbuilder path">
  <deck-row label="Source" left="Prompt-heavy or hand-built" right="Compact Markdown plus components"></deck-row>
  <deck-row label="Brand" left="Repeated in each slide" right="Centralized in definitions"></deck-row>
  <deck-row label="Browser" left="Often a static export" right="Rich presenter with built-in controls"></deck-row>
  <deck-row label="PowerPoint" left="Varies by prompt" right="Deterministic native output"></deck-row>
  <deck-row label="Maintenance" left="Fragile one-off edits" right="Reusable project and skill bundle"></deck-row>
></deck-comparison>

---

<deck-slide
  eyebrow="SWIMLANE"
  takeaway="Swimlanes keep parallel process stories aligned without manual geometry."
/>

# Two teams can share one visible flow

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
></deck-swimlane>

---

<deck-slide
  eyebrow="PROOF"
  takeaway="Proof slides combine stats, narrative context, source line, and optional logo area."
/>

# Similar teams see measurable lift

<deck-proof
  customer="SampleBank"
  logo="resource:logos/sample-customer.svg"
  bridge="Prospect relevance: the same operating controls apply to high-volume service journeys."
  source="Source: sample operating benchmark, June 2026"
>
  <deck-stat value="44%" label="less manual follow-up"></deck-stat>
  <deck-stat value="2.1x" label="faster completion"></deck-stat>
  <deck-stat value="28%" label="fewer exceptions"></deck-stat>
  <p>A controlled workflow reduces status chasing while preserving the evidence trail managers need.</p>
></deck-proof>

---

<deck-slide
  eyebrow="LOGO WALL"
  takeaway="Logo walls use real images when available and text tiles when a verified asset is not present."
/>

# The same pattern supports real or text-only logos

<deck-logo-wall title="Reference customer set">
  <deck-logo name="SampleBank" image="resource:logos/sample-customer.svg"></deck-logo>
  <deck-logo name="Deckbuilder" image="resource:logos/sample-corporate.svg"></deck-logo>
  <deck-logo name="Auto Finance Co."></deck-logo>
  <deck-logo name="Digital Bank"></deck-logo>
  <deck-logo name="Retail Finance"></deck-logo>
  <deck-logo name="Global Lender"></deck-logo>
  <deck-logo name="Service Team A"></deck-logo>
  <deck-logo name="Operations Team B"></deck-logo>
></deck-logo-wall>

---

<deck-slide
  eyebrow="NEXT STEPS"
  takeaway="Numbered next steps are clean in HTML and editable in PPTX."
  animation="enter-fade"
  animation-trigger="on-click"
  animation-sequence="stagger"
  animation-duration="500"
/>

# Use the suite as a regression deck

<deck-next-steps>
  <deck-step title="Open the browser output"><p>Use the HTML presenter for animation, navigation, and visual inspection.</p></deck-step>
  <deck-step title="Inspect the PowerPoint"><p>Confirm slide count, editable chart parts, embedded SVG visuals, and animation timing XML.</p></deck-step>
  <deck-step title="Rerun validation"><p>Keep npm test, check, bundle, and smoke tests green before publishing the skill.</p></deck-step>
></deck-next-steps>

---

<deck-close title="Browser for impact. PPTX for handoff." name="Codex" role="Deck Skill Showcase"></deck-close>
