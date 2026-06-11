---
title: Baseline Present Skill
subtitle: Renderer-owned presentation source
presenter:
  name: Corporate Agent
  role: Baseline Presentation Author
defaultSurface: light
customerName: Example Customer
---

<deck-exec-title
  eyebrow="Present Baseline"
  title="Markdown in.|Renderer out."
  subtitle="Agents write compact component Markdown. The renderer owns layout, brand chrome, HTML, and editable PPTX."
  accent="blue"
  surface="dark"
></deck-exec-title>

---

<deck-exec-metrics
  section-title="Baseline operating model"
  takeaway="Keep authored Markdown small. Put brand and layout decisions in renderer resources."
  surface="light"
>
  <deck-exec-metric value="3" label="baseline skills" accent="blue"></deck-exec-metric>
  <deck-exec-metric value="11" label="runtime chunks per skill" accent="cyan"></deck-exec-metric>
  <deck-exec-metric value="0" label="inline CSS or JS required" accent="green"></deck-exec-metric>
  <deck-exec-panel title="Authoring contract" body="Use structured deck components when the output must remain editable in PowerPoint." note="HTML and PPTX are both built from this source." accent="purple"></deck-exec-panel>
</deck-exec-metrics>

---

<!-- eyebrow: CAPABILITY MIX -->
<!-- takeaway: Structured chart data becomes renderer-owned chart output in HTML and PPTX. -->

# Skills mapped to output

<deck-chart
  type="bar"
  title="Baseline usage"
  series="Readiness"
  labels="Present, Rich HTML, Report"
  values="94, 88, 91"
></deck-chart>

---

<!-- eyebrow: AGENT RULES -->
<!-- takeaway: The renderer handles the beautiful part; agents handle source clarity. -->

# What the agent writes

<deck-card-grid columns="3">
  <deck-card title="Narrative"><p>Write concise slide copy, headings, and decision-focused takeaways.</p></deck-card>
  <deck-card title="Components"><p>Use supported deck tags for charts, cards, proof, next steps, and executive layouts.</p></deck-card>
  <deck-card title="Brand inputs"><p>Reference resources logically and let the renderer place logos and backgrounds.</p></deck-card>
</deck-card-grid>

---

<!-- eyebrow: HANDOFF -->

# Import sequence

<deck-next-steps>
  <deck-step title="Clean old bundles"><p>Remove stale tool/dist chunks before importing the updated baseline.</p></deck-step>
  <deck-step title="Restore private branding"><p>Reapply corporate resources, theme tokens, logos, fonts, and background assets.</p></deck-step>
  <deck-step title="Verify output"><p>Build HTML and PPTX, then check light and dark surfaces before sharing.</p></deck-step>
</deck-next-steps>

---

<deck-close title="Ready for work import" name="Corporate Agent" role="Renderer-owned present baseline"></deck-close>
